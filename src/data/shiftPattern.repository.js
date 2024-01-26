function ShiftPatternRepository() {
    var _self = this;

    _self.shiftPatternsCache = _fetchShiftPatterns().slice();

    _self.getShiftPatterns = function () {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(_self.shiftPatternsCache);
            }, 100);
        });
    };

    function _fetchShiftPatterns() {
        return [
            {
                team: 'A',
                startDate: '2018-07-01',
                pattern: 'DDDD----NNNN----'
            },
            {
                team: 'B',
                startDate: '2018-07-01',
                pattern: '----DDDD----NNNN'
            },
            {
                team: 'C',
                startDate: '2018-07-01',
                pattern: 'NNNN----DDDD----'
            },
            {
                team: 'D',
                startDate: '2018-07-01',
                pattern: '----NNNN----DDDD'
            },
        ]
    }
}