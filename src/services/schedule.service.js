function ScheduleService(employeeRepository, shiftPatternRepository, shiftRepository, employeeCount) {
    var _self = this;

    _self.employeeRepository = employeeRepository;
    _self.shiftPatternRepository = shiftPatternRepository;
    _self.shiftRepository = shiftRepository;
    _self.employeeCount = employeeCount;

    _self.getCurrentShifts = async function () {
        return _self.shiftRepository.getShifts();
    }

    _self.getEmployeeSchedules = async function (startDate, endDate) {
        var filteredEmployeeSchedules = [];
        var employeeSchedules = await _fetchEmployeeSchedules();
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

    _self.updateEmployeeShift = async function (employeeShiftId, updatedEmployeeShift) {
        let { employeeShift, employeeSchedule } = await _self.getEmployeeShift(employeeShiftId);

        if(!employeeShift) {
            throw new Error("Could not find shift.");
        }

        return _self.shiftRepository.updateShift(employeeShiftId, updatedEmployeeShift);
    };

    async function _fetchEmployeeSchedules() {
        var employeeSchedules = [];

        let employees = (await _self.employeeRepository.getEmployees()).slice(0, _self.employeeCount);

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
