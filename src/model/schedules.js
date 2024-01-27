class ScheduleGraph {
    constructor(employeeRepository, shiftRepository) {
        // Initialize graph data structures and repositories
        this.employees = {};
        this.shifts = {};
        this.edges = [];
        this.employeeRepository = employeeRepository;
        this.shiftRepository = shiftRepository;

        // Build the graph on instantiation
        this.buildGraph();
    }

    buildGraph() {
        // Clear existing data
        this.employees = {};
        this.shifts = {};
        this.edges = [];

        // Load employees as nodes into the graph
        for (const employee of this.employeeRepository) {
            this.employees[employee.employeeId] = {
                id: `employee_${employee.employeeId}`,
                employeeId: employee.employeeId,
                firstName: employee.firstName,
                lastName: employee.lastName,
                position: employee.position,
                location: employee.location,
                team: employee.team
            };
        }

        // Create shift nodes
        this.createShiftNodes();

        // Add edges between employees and shifts
        this.addEdges();

        // Calculate weights for consecutive shifts
        this.calculateWeights();

    }

    // New method to create shift nodes
    createShiftNodes() {
        const uniqueShiftDates = [...new Set(this.shiftRepository.map(shift => shift.shiftDate))];

        for (const shiftDate of uniqueShiftDates) {
            const shiftNode = {
                id: `shift_${shiftDate}`, // Unique identifier for shift nodes based on date
                shiftDate: shiftDate,
                label: "Shift Date" // Label for shift nodes, modify as needed
                // Add other shift properties as needed
            };

            // Add shift node to the graph
            this.shifts[shiftNode.id] = shiftNode;
        }
    }

    // New method to add edges between employees and shifts
    addEdges() {
        for (const shift of this.shiftRepository) {
            const employeeId = shift.employeeId;
            const shiftNode = this.shifts[`shift_${shift.shiftDate}`];

            if (employeeId in this.employees && shiftNode && (shift.shiftCode === 'N' || shift.shiftCode === 'D')) {
                const employeeNode = this.employees[employeeId];

                // Add edge
                this.edges.push({
                    source: employeeNode.id,
                    target: shiftNode.id,
                    label: shift.shiftCode,
                    weight: 0 // starts with zero then calculateWeights() will update accordingly
                });
            }
        }
    }

    // New method to calculate weights for consecutive shifts
    calculateWeights() {
        for (const employeeId in this.employees) {
            const employeeNode = this.employees[employeeId];
            const employeeEdges = this.edges.filter(edge => edge.source === employeeNode.id);
            const sortedEdges = employeeEdges.sort((a, b) => moment(a.target.slice(6)).diff(moment(b.target.slice(6))));

            for (let i = 1; i < sortedEdges.length; i++) {
                const currentEdge = sortedEdges[i];
                const previousEdge = sortedEdges[i - 1];
                const currentDate = moment(currentEdge.target.slice(6));
                const previousDate = moment(previousEdge.target.slice(6));

                if (currentDate.diff(previousDate, 'days') === 1) {
                    currentEdge.weight = previousEdge.weight + 1;
                } else {
                    currentEdge.weight = 1;
                }
            }
        }
    }

    // New method to update a property of a shift in shiftRepository using shiftId
    updateShiftProperty(shiftId, property, value) {
        const shiftToUpdate = this.shiftRepository.find(shift => shift.id === shiftId);

        if (shiftToUpdate) {
            let previousValue = shiftToUpdate[property];
            shiftToUpdate[property] = value;
            // Rebuild the graph after updating the shift
            this.buildGraph();
            return previousValue;
        } else {
            console.error(`Shift with ID ${shiftId} not found.`);
        }
    }

    // New method to check if the graph has any edge with weight greater than a specified value (default: 5)
    hasEdgesWithWeightGreaterThan(value = 5) {
        return this.edges.some(edge => edge.weight > value);
    }

}
