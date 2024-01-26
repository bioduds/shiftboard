var positions = [
    { code: "DEV", description: "Developer" },
    { code: "SALE", description: "Sales" },
    { code: "HR", description: "Human Resources" },
    { code: "MKTG", description: "Marketing" },
    { code: "TRN", description: "Training" }
];

var locations = [
    { code: "SEA", description: "Seattle" },
    { code: "VAN", description: "Vancouver" }
]

var shiftCodes = [
    { code: "-", description: "Not Working" },
    { code: "D", description: "Day" },
    { code: "N", description: "Night" }
];

function ShiftController(scheduleService, scheduleGraph, onScheduleChange) {
    var _self = this;

    _self.selectedShiftElement = {};
    _self.scheduleService = scheduleService;
    _self.onScheduleChange = onScheduleChange;
    _self.scheduleGraph = scheduleGraph;

    _self.select = async function (event) {
        var shiftElement = event.currentTarget;

        $(_self.selectedShiftElement).popover('dispose');

        if (_self.selectedShiftElement == shiftElement) {
            $(".s2").removeClass("sp");
            _self.selectedShiftElement = {};

            return;
        }

        _self.selectedShiftElement = shiftElement;
        shiftElement.classList.remove('sp');
        let { employeeShift } = await _self.scheduleService.getEmployeeShift(parseInt(shiftElement.dataset.employeeShiftId));

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

    _self.deselect = function () {
        $(".s2").removeClass("sp");
        $(_self.selectedShiftElement).popover('dispose');
        _self.selectedShiftElement = {};
    }

    _self.applyChanges = async function () {
        var shiftId = parseInt(_self.selectedShiftElement.dataset.employeeShiftId);

        var positionSelect = document.getElementById("position-select");
        var locationSelect = document.getElementById("location-select");
        var shiftSelect = document.getElementById("shift-select");

        var updatedShift = {
            position: positionSelect.options[positionSelect.selectedIndex].value,
            location: locationSelect.options[locationSelect.selectedIndex].value,
            shiftCode: shiftSelect.options[shiftSelect.selectedIndex].value
        };

        console.log( "Hang on. I have shiftId: " + shiftId + " and updatedShift: " + updatedShift );

        let meGetTheShifts = await _self.scheduleService.getCurrentShifts();

        // console.log("Crazy bird sees: ");
        // console.log(meGetTheShifts);

        // let's try to access scheduleGraph's repositories

        let scheduleGraphShiftRepo = _self.scheduleGraph.shiftRepository;

        console.log( "Checking scheduleGraph shiftRepo: " );
        console.log(scheduleGraphShiftRepo);

        // now we will pass the shiftId and change
        let previousValue = await _self.scheduleGraph.updateShiftProperty(shiftId, "shiftCode", updatedShift.shiftCode);

        console.log( "Checking Previous Value: " + previousValue );

        // now we must test if the graph has any edge with edge greater than 5. If yes, we must prevent this applyChanges from happening and alert. Then revert anything that must be reversed
        let meCheck = await _self.scheduleGraph.hasEdgesWithWeightGreaterThan(5);

        console.log( "Has Edges with weight greater? " + meCheck );

        if( meCheck ) {
            alert("You are going to be fatigued this way. Sorry!");

            // revert graph to previousValue
            await _self.scheduleGraph.updateShiftProperty(shiftId, "shiftCode", previousValue);
        } else {
            try {
                await _self.scheduleService.updateEmployeeShift(shiftId, updatedShift);
    
                await _self.onScheduleChange();
    
                // console.log( meDoIt );
                // console.log( updatedShift );
    
                await _self.onScheduleChange();
                _self.deselect();
            }
            catch (error) {
                console.log(error);
            }
    
        }
    }

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
                    class="btn btn-primary mr-1 edit-popover-text">Apply
                </button>
                <button type="button"
                    id="btn-cancel"
                    class="btn btn-secondary edit-popover-text">Cancel
                </button>
            </div>
        `;
    }
}
