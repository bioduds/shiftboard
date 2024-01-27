function ScheduleService(employeeRepository, shiftPatternRepository, shiftRepository, employeeCount) {
    var _self = this;

    // Initialize service properties
    _self.employeeRepository = employeeRepository;
    _self.shiftPatternRepository = shiftPatternRepository;
    _self.shiftRepository = shiftRepository;
    _self.employeeCount = employeeCount;

    // Public method to get current shifts
    _self.getCurrentShifts = async function () {
        return _self.shiftRepository.getShifts();
    }

    // Public method to get employee schedules within a date range
    _self.getEmployeeSchedules = async function (startDate, endDate) {
        var filteredEmployeeSchedules = [];
        var employeeSchedules = await _fetchEmployeeSchedules();

        // Filter employee schedules based on the date range
        employeeSchedules.forEach(function (employeeSchedule) {
            var filteredEmployeeShifts = [];

            employeeSchedule.shifts.forEach(function (employeeShift) {
                if (employeeShift.shiftDate.isSameOrAfter(startDate) && employeeShift.shiftDate.isSameOrBefore(endDate)) {
                    filteredEmployeeShifts.push(employeeShift);
                }
            });

            filteredEmployeeSchedules.push({
                employee: employeeSchedule.employee,
                shifts: filteredEmployeeShifts
            });
        });

        return filteredEmployeeSchedules;
    };

    // Public method to get details of a specific employee shift
    _self.getEmployeeShift = async function (employeeShiftId) {
        var employeeSchedules = await _fetchEmployeeSchedules();
        for (const employeeSchedule of employeeSchedules) {
            for (const employeeShift of employeeSchedule.shifts) {
                if (employeeShift.id === employeeShiftId) {
                    return { employeeShift, employeeSchedule };
                }
            }
        }

        return null;
    };

    // Public method to update an employee shift
    _self.updateEmployeeShift = async function (employeeShiftId, updatedEmployeeShift) {
        let { employeeShift, employeeSchedule } = await _self.getEmployeeShift(employeeShiftId);

        if (!employeeShift) {
            throw new Error("Could not find shift.");
        }

        return _self.shiftRepository.updateShift(employeeShiftId, updatedEmployeeShift);
    };

    // Private method to fetch employee schedules
    async function _fetchEmployeeSchedules() {
        var employeeSchedules = [];

        // Fetch a subset of employees based on the specified count
        let employees = (await _self.employeeRepository.getEmployees()).slice(0, _self.employeeCount);

        // Iterate through employees and populate their shifts
        for (const employee of employees) {
            let employeeShifts = [];
            let shifts = await _self.shiftRepository.getShifts();
            shifts.forEach(function (shift) {
                if (shift.employeeId === employee.employeeId) {
                    employeeShifts.push({
                        id: shift.id,
                        shiftDate: moment(shift.shiftDate),
                        position: shift.position,
                        location: shift.location,
                        shiftCode: shift.shiftCode,
                        employeeId: shift.employeeId
                    });
                }
            });

            employeeSchedules.push({
                employee: employee,
                shifts: employeeShifts,
            });
        }

        return employeeSchedules;
    }
}
