function ScheduleController(scheduleService) {
    // Store a reference to the current instance
    var _self = this;
    
    // Initialize the schedule service
    _self.scheduleService = scheduleService;

    // Generate HTML for the employee schedule within the specified date range
    _self.getScheduleHtml = async function (startDate, endDate) {
        // Retrieve employee schedules from the schedule service
        let employeeSchedules = await _self.scheduleService.getEmployeeSchedules(startDate, endDate);

        // Initialize table headers with a fixed column and dynamically generated date columns
        var headers = `<th scope="col" style="width:200px">Employee</th>`;
        while (startDate <= endDate) {
            headers = headers.concat(`<th class="text-center" scope="col">${moment(startDate).format("ddd")}<br />${moment(startDate).format("MMM D")}</th>`);
            startDate = startDate.add(1, 'days');
        }

        // Generate HTML for each employee's schedule
        var employeeSchedulesHtml = employeeSchedules.map(employeeSchedule => `
            <tr>
                <th scope="row">
                    ${employeeSchedule.employee.firstName} <strong>${employeeSchedule.employee.lastName}</strong>
                    <br/>
                    <small>${employeeSchedule.employee.position}/${employeeSchedule.employee.location}/${employeeSchedule.employee.team}</small>
                </th>
                ${_self.getEmployeeScheduleHtml(employeeSchedule)}
            </tr>`).join("");

        // Construct the final HTML structure
        return `        
            <div class="table-responsive">
                <table class="table table-bordered table-hover table-no-padding">
                    <thead>
                        <tr>
                            ${headers}
                        </tr>
                    </thead>
                    <tbody>
                        ${employeeSchedulesHtml}
                    </tbody>
                </table>
            </div>`;
    };

    // Generate HTML for an employee's schedule
    _self.getEmployeeScheduleHtml = function (employeeSchedule) {
        return employeeSchedule.shifts
            .map(shift => `<td>${_self.getShiftHtml(shift, employeeSchedule)}</td>`)
            .join("");
    }

    // Generate HTML for a shift
    _self.getShiftHtml = function (shift, employeeSchedule) {
        return `
            <div class="s2 md" data-employee-shift-id="${shift.id}" data-employee="${employeeSchedule.employee.lastName}">
                <div class="c">
                    <div class="sw">
                        <div class="so">
                            <div class="stcb" style="background-color:${_self.getShiftColorByShiftCode(shift.shiftCode)};"></div>
                            <div class="sd dark uppercase" style="background-color: ${_self.getShiftBackgroundColorByShiftCode(shift.shiftCode)};">
                                <div style="display:none;" class="wrv"></div>
                                <div class="position">${shift.position}</div>
                                <div class="location">${shift.shiftCode}</div>
                                <div style="display:none;" id="loading-requirement"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="s2i"></div>
            </div>`;
    };

    // Get the color for a shift based on the shift code
    _self.getShiftColorByShiftCode = function (shiftCode) {
        if (shiftCode === 'D') {
            return '#3399FF';
        } else if (shiftCode === 'N') {
            return '#9933FF';
        }
        return '#F5F5F5';
    }

    // Get the background color for a shift based on the shift code
    _self.getShiftBackgroundColorByShiftCode = function (shiftCode) {
        if (shiftCode === 'D') {
            return '#3399FF1A';
        } else if (shiftCode === 'N') {
            return '#9933FF1A';
        }
        return '#F5F5F5';
    }
}
