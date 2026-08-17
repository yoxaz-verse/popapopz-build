import type {
  ArchitecturePath,
  BOMItem,
  EngineeringDecision,
  EngineeringPhase,
  Machine,
  MachineModule,
  PrototypeStage,
  Requirement
} from "@/types/engineering";

export const machine: Machine = {
  id: "popapopz-prototype-001",
  name: "POPAPOPZ Smart Beverage Dispensing System",
  envelopeMm: { height: 1850, width: 850, depth: 800 },
  type: "Floor-standing commercial beverage dispensing machine",
  prototype: "P0 - In Development",
  targets: [
    { label: "Daily throughput", value: "500-1000 drinks/day", status: "TO VALIDATE" },
    { label: "Drink preparation time", value: "<=45 seconds", status: "TO VALIDATE" },
    { label: "Cup sizes", value: "4 sizes", status: "PROPOSED" },
    { label: "Flavor channels", value: "4 channels", status: "PROPOSED" },
    { label: "Boba channels", value: "3 channels", status: "PROPOSED" }
  ]
};

export const modules: MachineModule[] = [
  {
    id: "boba",
    name: "Boba Dispensing System",
    shortName: "Boba",
    category: "food-contact",
    status: "Prototype",
    evidence: "TO VALIDATE",
    purpose: "Dispenses controlled portions of popping boba into the customer's drink.",
    architecture: "Three removable food-grade containers feeding a controlled dosing mechanism.",
    channels: "3",
    portionRange: "15-60 g",
    targetAccuracy: "+/-2-5 g",
    inputs: ["Boba", "24V power", "Controller signal"],
    outputs: ["Controlled boba portion"],
    sensors: ["Level sensor", "Position sensor", "Optional weight verification"],
    actuators: ["Servo or stepper dosing mechanism"],
    safety: ["Food-contact material compatibility", "Jam detection", "Door interlock"],
    cleaning: ["Removable cartridge", "Drainable food-contact path", "Sanitization procedure"],
    maintenance: ["Inspect dosing gate", "Clean cartridge seals", "Verify portion repeatability"],
    openDecisions: ["Gravity gate vs rotary cup vs auger", "Servo vs stepper", "Refrigeration requirement"],
    color: "#2dd4bf"
  },
  {
    id: "flavor",
    name: "Flavor Cartridge System",
    shortName: "Flavor",
    category: "fluid",
    status: "In Progress",
    evidence: "PROPOSED",
    purpose: "Stores and meters flavored concentrates into the dispensing nozzle.",
    architecture: "Four cartridge bays routed through food-grade pumps and flow control.",
    channels: "4",
    inputs: ["Flavor concentrate", "24V power", "Pump control signal"],
    outputs: ["Metered flavor dose"],
    sensors: ["Cartridge presence", "Level detection", "Flow meter"],
    actuators: ["Peristaltic or diaphragm pumps", "Isolation valves"],
    safety: ["Backflow prevention", "Leak detection", "Food-contact tubing"],
    cleaning: ["CIP-compatible lines", "Flush cycle", "Replaceable tubing cassette"],
    maintenance: ["Replace pump tubing", "Inspect cartridge bay", "Calibrate dose volume"],
    openDecisions: ["Pump type", "Cartridge interface", "Concentrate viscosity limits"],
    color: "#f472b6"
  },
  {
    id: "cup",
    name: "Cup Dispensing Module",
    shortName: "Cup",
    category: "mechanical",
    status: "In Progress",
    evidence: "PROPOSED",
    purpose: "Automatically releases the selected cup size into the preparation chamber.",
    architecture: "Stacked cup magazines with escapement and cup-present verification.",
    channels: "4 cup sizes",
    inputs: ["Cup stacks", "24V power", "Cup-size selection"],
    outputs: ["Single cup positioned for dispensing"],
    sensors: ["Cup-present sensor", "Magazine low sensor", "Jam sensor"],
    actuators: ["Escapement motor", "Indexing mechanism"],
    safety: ["Pinch-point guarding", "Jam timeout", "Service door interlock"],
    cleaning: ["Removable cup path", "Dust cover", "Operator wipe-down"],
    maintenance: ["Clear jams", "Adjust cup guides", "Inspect escapement wear"],
    openDecisions: ["Cup nesting tolerance", "Magazine capacity", "Universal vs size-specific escapement"],
    color: "#facc15"
  },
  {
    id: "water",
    name: "Water and Carbonation System",
    shortName: "Carbonation",
    category: "fluid",
    status: "Review",
    evidence: "TO VALIDATE",
    purpose: "Filters, chills, carbonates, and routes water for still and sparkling beverages.",
    architecture: "Filtered inlet feeds chiller, carbonator, buffer, valves, and dispensing manifold.",
    inputs: ["Water inlet", "CO2", "230V AC", "Control signals"],
    outputs: ["Still water", "Carbonated water"],
    sensors: ["Flow meter", "Pressure sensor", "Temperature sensor", "Leak sensor"],
    actuators: ["Solenoid valves", "Booster pump", "Carbonator pump"],
    safety: ["Pressure relief", "Leak lockout", "CO2 cylinder restraint"],
    cleaning: ["Flush circuit", "Descale plan", "Sanitization bypass"],
    maintenance: ["Replace filters", "Inspect CO2 regulator", "Check carbonation pressure"],
    openDecisions: ["Inline vs tank carbonator", "Chiller capacity", "CO2 consumption model"],
    color: "#38bdf8"
  },
  {
    id: "refrigeration",
    name: "Refrigeration Module",
    shortName: "Refrigeration",
    category: "refrigeration",
    status: "Not Started",
    evidence: "ASSUMPTION",
    purpose: "Maintains required temperatures for ingredients and chilled water where needed.",
    architecture: "Dedicated cooled bay with thermal monitoring and serviceable condenser airflow.",
    inputs: ["230V AC", "Thermal load", "Controller setpoint"],
    outputs: ["Chilled storage", "Heat rejection"],
    sensors: ["Cabinet temperature", "Evaporator temperature", "Door switch"],
    actuators: ["Compressor", "Condenser fan", "Evaporator fan"],
    safety: ["Thermal alarm", "Food-safety lockout", "Ventilation clearance"],
    cleaning: ["Condensate management", "Wipeable liner", "Accessible evaporator cover"],
    maintenance: ["Clean condenser", "Verify seals", "Log temperature stability"],
    openDecisions: ["Which ingredients require refrigeration", "Cooling capacity", "Service access"],
    color: "#60a5fa"
  },
  {
    id: "electrical",
    name: "Electrical Architecture",
    shortName: "Electrical",
    category: "electrical",
    status: "In Progress",
    evidence: "CALCULATED",
    purpose: "Distributes protected AC and low-voltage power to machine subsystems.",
    architecture: "230V AC inlet, isolator, RCBO, surge protection, 24V SMPS, fused branch circuits.",
    inputs: ["230V AC mains", "Earth bond"],
    outputs: ["24V DC control power", "Protected AC branches"],
    sensors: ["Emergency stop", "Door interlock", "Leak sensor", "Current monitoring"],
    actuators: ["Contactors", "Relays", "Door lock", "Lighting"],
    safety: ["RCBO", "E-stop", "Protective earth", "IP-rated separation from fluid bay"],
    cleaning: ["Electrical bay isolated from wash-down paths"],
    maintenance: ["Torque terminal checks", "Inspect cable glands", "Verify earth continuity"],
    openDecisions: ["SMPS capacity", "Panel layout", "Certification path"],
    color: "#fb7185"
  },
  {
    id: "controller",
    name: "PLC / Controller",
    shortName: "Controller",
    category: "control",
    status: "Review",
    evidence: "PROPOSED",
    purpose: "Coordinates dispense sequence, safety states, HMI, telemetry, and service modes.",
    architecture: "Industrial controller with distributed I/O and HMI/cloud interface.",
    inputs: ["Sensors", "Payment confirmation", "Order queue", "Service commands"],
    outputs: ["Motor commands", "Pump commands", "Valve commands", "State telemetry"],
    sensors: ["All digital and analog machine I/O"],
    actuators: ["Pumps", "Valves", "Motors", "Locks", "Lights"],
    safety: ["Fault state", "E-stop handling", "Cleaning lockout", "Watchdog"],
    cleaning: ["Cleaning cycle recipes", "Operator prompts", "Cycle evidence logging"],
    maintenance: ["Backup configuration", "Update firmware", "Review error logs"],
    openDecisions: ["PLC vs industrial PC", "I/O margin", "Offline operating mode"],
    color: "#a78bfa"
  },
  {
    id: "prep",
    name: "Preparation Chamber",
    shortName: "Prep",
    category: "food-contact",
    status: "Prototype",
    evidence: "TO VALIDATE",
    purpose: "Receives the cup, coordinates dispensing, mixing, quality check, and handoff.",
    architecture: "Enclosed food-contact chamber with nozzle tree, cup positioning, drain, and pickup door.",
    inputs: ["Cup", "Water", "Flavor", "Modifiers", "Boba"],
    outputs: ["Finished beverage", "Waste rinse"],
    sensors: ["Cup position", "Door state", "Splash/leak sensor", "Optional weight sensor"],
    actuators: ["Cup shuttle", "Nozzle valves", "Mixer", "Pickup door lock"],
    safety: ["Customer separation", "Door lock", "Spill containment"],
    cleaning: ["Rinse nozzle", "Drain slope", "Daily wipe-down access"],
    maintenance: ["Inspect chamber seal", "Clean drain", "Verify cup alignment"],
    openDecisions: ["Mixing method", "Drain geometry", "Quality check sensor"],
    color: "#34d399"
  }
];

export const phases: EngineeringPhase[] = [
  { id: "01", title: "Product Requirements", status: "In Progress", progress: 80, objective: "Define machine scope, throughput targets, user flows, and validation criteria.", validation: "Requirements review with risk and assumption register." },
  { id: "02", title: "System Architecture", status: "Review", progress: 62, objective: "Map mechanical, fluid, electrical, control, and software boundaries.", validation: "Architecture review and revision freeze." },
  { id: "03", title: "Machine Space Allocation", status: "In Progress", progress: 48, objective: "Allocate the 1850 x 850 x 800 mm envelope across serviceable modules.", validation: "3D packaging review with maintenance access checks." },
  { id: "04", title: "Mechanical Architecture", status: "In Progress", progress: 35, objective: "Define frame, enclosure, cup path, cartridges, chamber, and service doors.", validation: "Prototype mechanism tests." },
  { id: "05", title: "Fluid Architecture", status: "In Progress", progress: 42, objective: "Route water, carbonation, flavor, modifiers, cleaning, and waste circuits.", validation: "Pressure, leak, dose accuracy, and sanitation testing." },
  { id: "06", title: "Dispensing Validation", status: "Not Started", progress: 8, objective: "Validate cup, liquid, boba, and modifier dosing repeatability.", validation: "Measured dispense tests across recipes and duty cycles." },
  { id: "07", title: "Electrical Architecture", status: "In Progress", progress: 36, objective: "Size and protect AC/DC power distribution with spare I/O capacity.", validation: "Panel review, load test, earth continuity, and safety inspection." },
  { id: "08", title: "Control Architecture", status: "Review", progress: 30, objective: "Define state machine, controller platform, I/O map, and fault handling.", validation: "Dry-run sequence and fault-injection tests." },
  { id: "09", title: "Software", status: "Not Started", progress: 12, objective: "Build HMI, order queue, telemetry, service tools, and data logging.", validation: "Simulation, integration test, and operator acceptance." },
  { id: "10", title: "Cleaning & Food Safety", status: "Not Started", progress: 10, objective: "Define food-contact materials, cleaning cycles, lockouts, and evidence logs.", validation: "Sanitation validation and operator SOP review." }
];

export const requirements: Requirement[] = [
  { id: "REQ-001", area: "Throughput", statement: "Machine shall target 500-1000 drinks per day.", priority: "Must", status: "TO VALIDATE", owner: "Product" },
  { id: "REQ-002", area: "Dispense Time", statement: "Machine shall target drink preparation in 45 seconds or less.", priority: "Must", status: "TO VALIDATE", owner: "Systems" },
  { id: "REQ-003", area: "Menu", statement: "Machine shall support four cup sizes, four flavor channels, and three boba channels.", priority: "Must", status: "PROPOSED", owner: "Product" },
  { id: "REQ-004", area: "Safety", statement: "Food-contact and electrical areas shall remain physically separated and service-interlocked.", priority: "Must", status: "APPROVED", owner: "Safety" },
  { id: "REQ-005", area: "Cleaning", statement: "Machine shall prevent customer operation when mandatory cleaning is overdue.", priority: "Must", status: "PROPOSED", owner: "Food Safety" },
  { id: "REQ-006", area: "Service", statement: "All food-contact cartridges shall be removable without specialist tools.", priority: "Should", status: "ASSUMPTION", owner: "Mechanical" }
];

export const decisions: EngineeringDecision[] = [
  {
    id: "DEC-001",
    title: "Boba dosing mechanism",
    subsystem: "Boba",
    problem: "Select a repeatable dosing method for fragile popping boba without crushing or jamming.",
    options: ["Gravity gate", "Rotary cup", "Auger", "Servo gate"],
    recommendation: "To be experimentally validated",
    reason: "Portion accuracy and boba damage risk cannot be resolved from theory alone.",
    costImpact: "Medium",
    reliabilityImpact: "High",
    foodSafetyImpact: "High",
    manufacturingImpact: "Medium",
    status: "Open"
  },
  {
    id: "DEC-002",
    title: "Controller platform",
    subsystem: "Control",
    problem: "Choose PLC, industrial PC, or hybrid controller for machine sequencing and telemetry.",
    options: ["Compact PLC", "Industrial PC", "PLC + edge gateway"],
    recommendation: "PLC + edge gateway",
    reason: "Keeps safety-critical I/O deterministic while allowing richer HMI and cloud features.",
    costImpact: "Medium",
    reliabilityImpact: "High",
    foodSafetyImpact: "Medium",
    manufacturingImpact: "Medium",
    status: "Review"
  },
  {
    id: "DEC-003",
    title: "Carbonation architecture",
    subsystem: "Water",
    problem: "Determine whether inline or buffer-tank carbonation best supports peak queue demand.",
    options: ["Inline carbonator", "Carbonated buffer tank", "Hybrid buffer"],
    recommendation: "Run bench test before freeze",
    reason: "Demand profile and water temperature control will drive actual CO2 absorption performance.",
    costImpact: "High",
    reliabilityImpact: "Medium",
    foodSafetyImpact: "Medium",
    manufacturingImpact: "High",
    status: "Open"
  }
];

export const bomItems: BOMItem[] = [
  { partNumber: "PPZ-FRM-001", component: "Welded frame", subsystem: "Machine Layout", specification: "Floor-standing frame sized to 1850 x 850 x 800 mm envelope", quantity: 1, material: "Powder-coated steel or stainless steel", supplierCategory: "Fabrication", estimatedCost: "TBD", leadTime: "TBD", criticality: "High", alternative: "Modular aluminum extrusion", status: "PROPOSED" },
  { partNumber: "PPZ-HMI-001", component: "Touchscreen HMI", subsystem: "HMI", specification: "Commercial touchscreen, splash-resistant front", quantity: 1, material: "Glass / electronics", supplierCategory: "Electronics", estimatedCost: "TBD", leadTime: "TBD", criticality: "High", alternative: "Industrial panel PC", status: "PROPOSED" },
  { partNumber: "PPZ-PMP-001", component: "Flavor dosing pump", subsystem: "Flavor", specification: "Food-grade metering pump, final flow rate to validate", quantity: 4, material: "Food-grade polymer", supplierCategory: "Fluid handling", estimatedCost: "TBD", leadTime: "TBD", criticality: "High", alternative: "Diaphragm pump", status: "TO VALIDATE" },
  { partNumber: "PPZ-SNS-001", component: "Leak sensor", subsystem: "Safety", specification: "Low-voltage leak detection in fluid bay", quantity: 3, material: "Electronics", supplierCategory: "Sensors", estimatedCost: "TBD", leadTime: "TBD", criticality: "High", alternative: "Conductive strip sensor", status: "COMPONENT RATED" },
  { partNumber: "PPZ-CTL-001", component: "Controller", subsystem: "PLC / Controller", specification: "Industrial controller with spare I/O target >=20%", quantity: 1, material: "Electronics", supplierCategory: "Controls", estimatedCost: "TBD", leadTime: "TBD", criticality: "High", alternative: "Industrial PC + remote I/O", status: "PROPOSED" }
];

export const prototypeStages: PrototypeStage[] = [
  {
    id: "P0",
    title: "Proof of Concept",
    status: "In Progress",
    objective: "Prove core dispense paths and packaging feasibility.",
    requiredFeatures: ["Cup placement mockup", "Water/flavor dosing bench", "Boba dosing test rig", "Digital twin navigation"],
    tests: ["Dose repeatability", "Jam observation", "Leak check", "Operator workflow walkthrough"],
    openRisks: ["Boba damage", "Cleaning practicality", "Chiller sizing unknown"],
    exitCriteria: ["Architecture reviewed", "Top three dosing mechanisms tested", "Critical risks ranked"]
  },
  {
    id: "P1",
    title: "Functional MVP",
    status: "Not Started",
    objective: "Build integrated machine that prepares controlled test drinks.",
    requiredFeatures: ["HMI prototype", "Order sequence", "Integrated fluid system", "Fault handling"],
    tests: ["100-cycle dispense test", "Fault injection", "Cleaning cycle dry run"],
    openRisks: ["Electrical certification path", "Serviceability", "Ingredient storage"],
    exitCriteria: ["Repeatable drink build", "Service SOP draft", "Electrical panel review"]
  },
  {
    id: "P2",
    title: "Commercial Prototype",
    status: "Not Started",
    objective: "Create a near-production machine for pilot validation.",
    requiredFeatures: ["Production-like enclosure", "Payment mock integration", "Telemetry", "Food safety controls"],
    tests: ["Reliability run", "Sanitation validation", "User acceptance"],
    openRisks: ["Manufacturing cost", "Regulatory findings", "Supply chain"],
    exitCriteria: ["Pilot-ready design package", "FMEA mitigations closed", "Revision freeze candidate"]
  }
];

export const architecturePaths: ArchitecturePath[] = [
  { id: "water", title: "Water / Carbonation", status: "TO VALIDATE", nodes: ["Water Inlet", "Filter", "Chiller", "Carbonator", "Buffer", "Flow Control", "Dispensing Nozzle"] },
  { id: "flavor", title: "Flavor Concentrate", status: "PROPOSED", nodes: ["Flavor Cartridge", "Pump", "Flow Control", "Dispensing Nozzle"] },
  { id: "boba", title: "Boba Portioning", status: "TO VALIDATE", nodes: ["Boba Container", "Dosing Mechanism", "Portion Verification", "Cup"] },
  { id: "electrical", title: "Power Distribution", status: "CALCULATED", nodes: ["230V AC", "Main Isolator", "RCBO", "Surge Protection", "24V SMPS", "Controller", "Branch Loads"] }
];

export const navigationSections = [
  "Product Requirements",
  "System Architecture",
  "Machine Layout",
  "Mechanical System",
  "Cup Dispensing",
  "Beverage System",
  "Boba System",
  "Modifier System",
  "Water System",
  "Carbonation",
  "Refrigeration",
  "Preparation Chamber",
  "Mixing",
  "Cleaning & Sanitation",
  "Electrical Architecture",
  "Electronics",
  "PLC / Controller",
  "Sensors & Actuators",
  "Software",
  "HMI / Customer UX",
  "Payment",
  "Queue Management",
  "Cloud / IoT",
  "Safety",
  "BOM",
  "Engineering Calculations",
  "Manufacturing",
  "Prototype Development",
  "Testing & Validation",
  "FMEA / Reliability",
  "Maintenance",
  "Certification",
  "Production Scaling",
  "Unit Economics"
];
