// Define position options
var positions = [
    { code: "DEV", description: "Developer" },
    { code: "SALE", description: "Sales" },
    { code: "HR", description: "Human Resources" },
    { code: "MKTG", description: "Marketing" },
    { code: "TRN", description: "Training" }
];

// Define location options
var locations = [
    { code: "SEA", description: "Seattle" },
    { code: "VAN", description: "Vancouver" }
]

// Define shift code options
var shiftCodes = [
    { code: "-", description: "Not Working" },
    { code: "D", description: "Day" },
    { code: "N", description: "Night" }
];

// ShiftController function
function ShiftController(scheduleService, scheduleGraph, onScheduleChange) {
    var _self = this;

    // Store selected shift element, schedule service, and callback for schedule changes
    _self.selectedShiftElement = {};
    _self.scheduleService = scheduleService;
    _self.onScheduleChange = onScheduleChange;
    _self.scheduleGraph = scheduleGraph;

    // Handle the selection of a shift
    _self.select = async function (event) {
        var shiftElement = event.currentTarget;

        // Dispose the popover of the previously selected shift
        $(_self.selectedShiftElement).popover('dispose');

        if (_self.selectedShiftElement == shiftElement) {
            $(".s2").removeClass("sp");
            _self.selectedShiftElement = {};
            return;
        }

        _self.selectedShiftElement = shiftElement;
        shiftElement.classList.remove('sp');
        let { employeeShift } = await _self.scheduleService.getEmployeeShift(parseInt(shiftElement.dataset.employeeShiftId));

        // Initialize and display a popover for editing the shift
        $(_self.selectedShiftElement).popover({
            title: `Editing shift`,
            content: _self.getPopoverEditHtml(employeeShift),
            placement: 'bottom',
            html: true,
            sanitize: false,
            boundary: 'window',
            template: `
                <div class="popover" role="tooltip">
                    <div class="arrow"></div>
                    <h3 class="popover-header"></h3>
                    <div class="popover-body"></div>
                </div>`
        });

        $(_self.selectedShiftElement).popover('show');
        $("#btn-cancel").on('click', _self.deselect);
        $("#btn-apply").on('click', _self.applyChanges);
    }

    // Handle the deselection of a shift
    _self.deselect = function () {
        $(".s2").removeClass("sp");
        $(_self.selectedShiftElement).popover('dispose');
        _self.selectedShiftElement = {};
    }

    // Handle applying changes to a shift
    _self.applyChanges = async function () {

        $('#btn-apply').prop('disabled', true);
        // Show the spinner and hide the text
        $('#applyText').hide();
        $('#applySpinner').removeClass('d-none');

        var shiftId = parseInt(_self.selectedShiftElement.dataset.employeeShiftId);

        var positionSelect = document.getElementById("position-select");
        var locationSelect = document.getElementById("location-select");
        var shiftSelect = document.getElementById("shift-select");

        var updatedShift = {
            position: positionSelect.options[positionSelect.selectedIndex].value,
            location: locationSelect.options[locationSelect.selectedIndex].value,
            shiftCode: shiftSelect.options[shiftSelect.selectedIndex].value
        };

        // Retrieve current shifts and update the shift in the scheduleGraph
        let meGetTheShifts = await _self.scheduleService.getCurrentShifts();
        let scheduleGraphShiftRepo = _self.scheduleGraph.shiftRepository;

        // now we will pass the shiftId and change
        let previousValue = await _self.scheduleGraph.updateShiftProperty(shiftId, "shiftCode", updatedShift.shiftCode);

        // now we must test if the graph has any edge with edge greater than 5.
        // If yes, we must prevent this applyChanges from happening and alert.
        // Then revert anything that must be reversed
        let meCheck = await _self.scheduleGraph.hasEdgesWithWeightGreaterThan(5);

        if (meCheck) {
            var fatigueModal = new bootstrap.Modal(document.getElementById('fatigueModal'));

            document.getElementById('okModalButton').addEventListener('click', function () {
                fatigueModal.hide();
            });

            // Hide the spinner and show the text
            $('#applyText').show();
            $('#applySpinner').addClass('d-none');

            // Re-enable the "Apply" button
            $('#btn-apply').prop('disabled', false);
            _self.deselect();

            fatigueModal.show();

            // revert graph to previousValue
            await _self.scheduleGraph.updateShiftProperty(shiftId, "shiftCode", previousValue);
        } else {
            try {
                // Update the employee shift, trigger schedule changes, and hide the spinner
                await _self.scheduleService.updateEmployeeShift(shiftId, updatedShift);
                await _self.onScheduleChange();

                // Hide the spinner and show the text
                $('#applyText').show();
                $('#applySpinner').addClass('d-none');

                // Re-enable the "Apply" button and deselect the shift
                $('#btn-apply').prop('disabled', false);
                _self.deselect();
            } catch (error) {
                // Hide the spinner and show the text
                $('#applyText').show();
                $('#applySpinner').addClass('d-none');

                // Re-enable the "Apply" button
                $('#btn-apply').prop('disabled', false);
                console.log(error);
            }

        }

    }

    // Generate HTML for the popover used in editing a shift
    _self.getPopoverEditHtml = function (shift) {
        return `
            <div class="mb-2">
            <select id="position-select" class="form-control mb-2 edit-popover-text">
                ${positions.map(position => `
                    <option ${shift.position == position.code ? `selected` : ``} 
                        value="${position.code}">${position.code} (${position.description})`)
                .join("")}
            </select >
            <select id="location-select" class="form-control mb-2 edit-popover-text">
                ${locations.map(location => `
                    <option ${shift.location == location.code ? `selected` : ``} 
                        value="${location.code}">${location.code} (${location.description})`)
                .join("")}
            </select>
            <select id="shift-select" class="form-control mb-2 edit-popover-text">
                ${shiftCodes.map(shiftCode => `
                    <option ${shift.shiftCode == shiftCode.code ? `selected` : ``} 
                        value="${shiftCode.code}">${shiftCode.code} (${shiftCode.description})`)
                .join("")}
            </select>
            </div >

            <div class="d-flex justify-content-end">
                <button type="button"
                    id="btn-apply"
                    class="btn btn-primary mr-1 edit-popover-text"
                    style="width: 80px;"> <!-- Set a fixed width, adjust as needed -->
                    <span id="applyText">Apply</span>
                    <span id="applySpinner" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                </button>
                <button type="button"
                    id="btn-cancel"
                    class="btn btn-secondary edit-popover-text">Cancel
                </button>
            </div>
      `;
    }
}
