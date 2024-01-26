class ScheduleGraph {
    constructor(employeeRepository, shiftRepository) {
        this.employees = {};
        this.shifts = {};
        this.edges = [];
        this.employeeRepository = employeeRepository;
        this.shiftRepository = shiftRepository;
        this.buildGraph();
    }

    buildGraph() {

        this.employees = {};
        this.shifts = {};
        this.edges = [];

        // Load employees as nodes into graph
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

        // Calculate weights
        this.calculateWeights(); // implement this

        // let's try some visuals
        this.printGraph( false );

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
            // You might want to rebuild the graph after updating the shift
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

    printGraph( visuals ) {
        console.log("Employees:");
        console.log(this.employees);
    
        console.log("\nShifts:");
        console.log(this.shifts);
    
        console.log("\nEdges with Weight > 0:");
    
        const filteredEdges = this.edges.filter(edge => edge.weight > 0);
        console.log(filteredEdges);
    
        if (visuals) {
            // Create nodes and edges arrays for vis.js
            const nodes = Object.values(this.employees).concat(Object.values(this.shifts));
            const edges = filteredEdges; // Use filtered edges
    
            // Create a data object for vis.js
            const data = {
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges)
            };
    
            // Create an options object for vis.js
            const options = {
                edges: {
                    arrows: {
                        to: true
                    }
                },
                layout: {
                    improvedLayout: false  // Disable improved layout
                }
            };
    
            // Create a new network using vis.js
            const container = document.getElementById('visualization');
            const network = new vis.Network(container, data, options);
        }
    }
    
}
