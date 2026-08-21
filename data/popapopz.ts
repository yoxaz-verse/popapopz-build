import type {
  ArchitecturePath,
  BOMItem,
  ComponentBuildPlan,
  ComponentPlanning,
  EngineeringDecision,
  EngineeringPhase,
  Machine,
  MachineModule,
  PrototypeStage,
  Requirement
} from "@/types/engineering";

const planningByModule: Record<string, ComponentPlanning> = {
  boba: {
    estimatedCostInr: { min: 85000, max: 160000 },
    buildDuration: "4-6 weeks",
    peopleNeeded: [
      { role: "Mechanical", count: 1 },
      { role: "Food-contact review", count: 1 },
      { role: "Controls", count: 1 }
    ],
    assemblyType: "Slide-in cartridge and dosing cassette",
    dependencies: ["Frame rails", "Waste manifold", "Controller I/O", "Prep chamber chute"],
    prototypeDeliverable: "Removable immersed-boba cartridge, low-shear dose cup, strainer drain, and soft release chute.",
    creationSteps: ["Bench-test pearl handling", "Prototype cartridge seals", "Build strainer dose cup", "Add load-cell mount", "Integrate drain and rinse path"],
    fitmentNotes: ["Mount above the pickup chamber with a short low-drop path.", "Keep cartridge removal at standing reach height."]
  },
  flavor: {
    estimatedCostInr: { min: 65000, max: 125000 },
    buildDuration: "3-5 weeks",
    peopleNeeded: [
      { role: "Fluid systems", count: 1 },
      { role: "Mechanical", count: 1 },
      { role: "Controls", count: 1 }
    ],
    assemblyType: "Front-load cartridge rack",
    dependencies: ["Nozzle tree", "Controller I/O", "Cleaning loop", "Prep chamber"],
    prototypeDeliverable: "Four-cartridge flavor rack with metering pumps, tubing cassette, and color-coded outlets.",
    creationSteps: ["Select pump type", "Build cartridge rack", "Route tubing cassette", "Add cartridge detection", "Calibrate each channel"],
    fitmentNotes: ["Keep tubes short and serviceable.", "Place cartridges above nozzle tree without blocking cup magazine."]
  },
  cup: {
    estimatedCostInr: { min: 75000, max: 150000 },
    buildDuration: "4-7 weeks",
    peopleNeeded: [
      { role: "Mechanical", count: 2 },
      { role: "Fabrication", count: 1 }
    ],
    assemblyType: "Stacked magazine module",
    dependencies: ["Frame/enclosure", "Prep chamber shuttle", "Cup sensors"],
    prototypeDeliverable: "Four-size cup magazine with escapement, jam detection, and gravity feed into handoff chamber.",
    creationSteps: ["Measure cup nesting", "Prototype escapement", "Build adjustable guides", "Add cup-present sensing", "Run jam tests"],
    fitmentNotes: ["Feed path must terminate around 1030 mm handoff height.", "Top refill must not require bending."]
  },
  water: {
    estimatedCostInr: { min: 120000, max: 240000 },
    buildDuration: "5-8 weeks",
    peopleNeeded: [
      { role: "Fluid systems", count: 1 },
      { role: "Electrical", count: 1 },
      { role: "Fabrication", count: 1 }
    ],
    assemblyType: "Lower technical service bay",
    dependencies: ["Refrigeration", "Nozzle tree", "Electrical bay", "Waste/drain"],
    prototypeDeliverable: "Filtered water, chiller/carbonation trial loop, valves, pressure sensing, and dispense manifold feed.",
    creationSteps: ["Select filter and regulator", "Build carbonator test loop", "Mount cylinders and restraints", "Add pressure/flow sensing", "Leak-test plumbing"],
    fitmentNotes: ["Keep CO2 restraint visible from the lower service door.", "Separate wet plumbing from the dry electrical bay."]
  },
  waste: {
    estimatedCostInr: { min: 45000, max: 95000 },
    buildDuration: "2-4 weeks",
    peopleNeeded: [
      { role: "Fluid systems", count: 1 },
      { role: "Mechanical", count: 1 }
    ],
    assemblyType: "Lowest removable drawer",
    dependencies: ["Prep chamber drain", "Boba strainer drain", "Cleaning cycle"],
    prototypeDeliverable: "Sealed waste tank, drain manifold, level sensing, and removable front drawer.",
    creationSteps: ["Size tank volume", "Build drain manifold", "Add tank present sensor", "Add level sensor", "Validate drain slope"],
    fitmentNotes: ["Place at the lowest bay for gravity drain.", "Drawer must pull out without contacting electrical parts."]
  },
  refrigeration: {
    estimatedCostInr: { min: 90000, max: 190000 },
    buildDuration: "4-8 weeks",
    peopleNeeded: [
      { role: "Refrigeration", count: 1 },
      { role: "Electrical", count: 1 },
      { role: "Mechanical", count: 1 }
    ],
    assemblyType: "Insulated cooled bay",
    dependencies: ["Frame airflow clearances", "Water/carbonation thermal load", "Ingredient storage decisions"],
    prototypeDeliverable: "Cooled bay with compressor/fan package, liner, temperature sensing, and serviceable condenser access.",
    creationSteps: ["Estimate thermal load", "Select compressor package", "Build insulated liner", "Add temp sensors", "Run stability test"],
    fitmentNotes: ["Reserve rear/side airflow.", "Avoid heating food-contact cartridge space from condenser exhaust."]
  },
  electrical: {
    estimatedCostInr: { min: 110000, max: 220000 },
    buildDuration: "3-6 weeks",
    peopleNeeded: [
      { role: "Electrical", count: 1 },
      { role: "Controls", count: 1 }
    ],
    assemblyType: "Dry protected panel",
    dependencies: ["Frame grounding", "Controller I/O list", "Wet bay separation"],
    prototypeDeliverable: "Protected AC/DC panel with isolator, RCBO, 24V supply, fusing, terminal blocks, and service lockout wiring.",
    creationSteps: ["Freeze load list", "Size supply and protection", "Lay out DIN rail", "Wire branch circuits", "Verify earth continuity"],
    fitmentNotes: ["Keep panel technician-only and separated from all drains.", "Leave slack loops for slide-out service modules."]
  },
  controller: {
    estimatedCostInr: { min: 95000, max: 210000 },
    buildDuration: "4-7 weeks",
    peopleNeeded: [
      { role: "Controls", count: 1 },
      { role: "Software", count: 1 },
      { role: "Electrical", count: 1 }
    ],
    assemblyType: "Chest-level HMI and control drawer",
    dependencies: ["Electrical panel", "Sensor map", "Actuator map", "Order queue UI"],
    prototypeDeliverable: "HMI/controller package with state machine, I/O map, service mode, and order queue demo.",
    creationSteps: ["Choose controller platform", "Map I/O", "Build HMI screens", "Program dispense sequence", "Run fault injection"],
    fitmentNotes: ["Screen target is 1350-1500 mm.", "Control drawer must be protected from prep chamber splash."]
  },
  prep: {
    estimatedCostInr: { min: 95000, max: 180000 },
    buildDuration: "4-6 weeks",
    peopleNeeded: [
      { role: "Mechanical", count: 1 },
      { role: "Food-contact review", count: 1 },
      { role: "Controls", count: 1 }
    ],
    assemblyType: "Belly-level chamber cassette",
    dependencies: ["Cup feed", "Nozzle tree", "Waste/drain", "Door lock"],
    prototypeDeliverable: "Pickup/prep chamber with cup shuttle, nozzle clearance, drain slope, splash guard, and pickup door.",
    creationSteps: ["Set cup clearance", "Build chamber box", "Add cup shuttle", "Mount nozzle tree", "Validate pickup door reach"],
    fitmentNotes: ["Keep handoff around 950-1100 mm.", "Cup clearance assumes 105 mm until actual cup SKUs are measured."]
  }
};

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
    purpose: "Stores fragile popping boba immersed in carrier liquid, separates the liquid during dosing, verifies the portion, and transfers pearls gently into the cup.",
    architecture: "Three removable liquid-filled cartridges feed a low-shear dosing and strainer chamber with drain-to-waste and load-cell verification before soft release to the cup.",
    channels: "3",
    portionRange: "15-60 g mapped to customer-facing S/M/L or approximate pearl count",
    targetAccuracy: "+/-2-5 g, TO VALIDATE with drained boba weight",
    inputs: ["Immersed popping boba cartridge", "Carrier liquid", "Rinse water", "24V power", "Controller signal"],
    outputs: ["Verified drained boba portion", "Carrier liquid waste", "Rinse waste"],
    sensors: ["Cartridge level", "Cartridge presence", "Dosing chamber load cell", "Drain confirmation", "Optional optical pearl counter", "Jam or blocked-drain sensor"],
    actuators: ["Low-shear fill valve or pump", "Gentle agitator", "Drain valve", "Soft gate or tilting portion cup", "Rinse valve"],
    safety: ["Food-contact material compatibility", "Low-shear path with no auger contact", "Overflow and blocked-drain lockout", "Door interlock"],
    cleaning: ["Post-dose rinse to waste", "Removable liquid cartridge", "Drainable strainer chamber", "Sanitization procedure with cycle evidence"],
    maintenance: ["Inspect perforated strainer", "Clean cartridge seals", "Verify load-cell tare", "Check drain valve and waste route"],
    openDecisions: ["Strainer cup geometry", "Carrier liquid specification and shelf life", "Refrigeration requirement", "Optical count value vs weight-only control"],
    handlingSequence: [
      "Keep popping boba immersed in a sealed removable cartridge until an order starts.",
      "Gently agitate or recirculate carrier liquid only enough to prevent settling.",
      "Fill a small dosing chamber with boba plus carrier liquid using low-shear motion.",
      "Drain carrier liquid through a perforated strainer cup into the waste path.",
      "Verify drained portion by load cell and map grams to customer-facing portion/count language.",
      "Release boba through a soft gate or tilting cup into a short, low-drop chute.",
      "Rinse chamber, strainer, gate, and chute into waste after each dose or batch window.",
      "Lock out dispense if drain, waste level, door, or weight verification fails."
    ],
    fluidCircuits: [
      "Food path: cartridge -> dosing chamber -> strainer cup -> soft release chute -> customer cup.",
      "Carrier liquid path: cartridge/dosing chamber -> strainer drain -> waste manifold -> sealed waste tank.",
      "Rinse path: clean water -> boba chamber/chute rinse -> waste manifold -> sealed waste tank."
    ],
    wasteStreams: ["Boba carrier liquid", "Post-dose rinse water", "Rejected or excess dose liquid", "Sanitizing solution"],
    validationMetrics: ["Pearl rupture rate", "Drained portion mass accuracy", "Residual liquid carryover", "Blocked-drain detection time", "100-cycle jam-free repeatability"],
    engineeringRisks: ["Pearls rupture under pump or gate shear", "Clumping prevents accurate drain/weight reading", "Carrier liquid residue increases sanitation load", "Waste tank overfill can contaminate food-contact bay"],
    zone: "Ingredient dosing bay above preparation chamber",
    heightMm: "1150-1320 mm",
    diameterMm: "Default boba pearl diameter: 8-12 mm, TO VALIDATE",
    serviceAccess: "Front removable cartridge drawer at standing reach height",
    validationNotes: ["Low-shear path and drained weight are assumptions until tested with actual boba and carrier liquid."],
    planning: planningByModule.boba,
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
    zone: "Ingredient cartridge bay above nozzle tree",
    heightMm: "1180-1340 mm",
    diameterMm: "Default tube inner diameter: 4-6 mm, TO VALIDATE",
    serviceAccess: "Front pull-out cartridge rack with color-coded lines",
    validationNotes: ["Pump and tube sizes remain placeholders until concentrate viscosity is measured."],
    planning: planningByModule.flavor,
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
    zone: "Upper-front gravity cup feed into belly-level pickup",
    heightMm: "1220-1680 mm magazine, 1030 mm handoff",
    diameterMm: "Default cup rim diameter: 90-98 mm, TO VALIDATE",
    serviceAccess: "Top/front refill path without bending",
    validationNotes: ["Cup diameter and nesting tolerance are assumed until actual cup SKUs are locked."],
    planning: planningByModule.cup,
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
    zone: "Lower right technical bay, physically separated from food-contact handoff",
    heightMm: "320-850 mm",
    diameterMm: "Default CO2 cylinder diameter: 140 mm, TO VALIDATE",
    serviceAccess: "Lower service door with cylinder restraint and regulator visibility",
    validationNotes: ["Cylinder and carbonator dimensions are placeholder packaging constraints."],
    planning: planningByModule.water,
    color: "#38bdf8"
  },
  {
    id: "waste",
    name: "Waste & Drain Management",
    shortName: "Waste",
    category: "fluid",
    status: "In Progress",
    evidence: "PROPOSED",
    purpose: "Collects carrier liquid, rinse water, purge liquid, drips, rejected dose liquid, and cleaning solution without cross-contaminating clean food-contact paths.",
    architecture: "Sloped drains and isolated waste tubing route all non-product liquids to a sealed tank or plumbed drain with level, leak, and overflow lockout.",
    channels: "Boba, flavor, water, prep chamber, drip tray, cleaning",
    inputs: ["Boba carrier liquid", "Rinse water", "Flavor purge", "Nozzle rinse", "Drip tray liquid", "Cleaning solution"],
    outputs: ["Sealed waste tank contents", "Waste-level telemetry", "Cleaning lockout state"],
    sensors: ["Waste tank level", "Tank present", "Leak sensor", "Drain flow confirmation", "Overflow switch", "Conductivity or cleaning-complete marker"],
    actuators: ["Drain valves", "Waste pump if not gravity drained", "Tank lock", "Service indicator lighting"],
    safety: ["Backflow prevention", "Overflow lockout", "Physical separation from clean water and ingredient bays", "Service-door interlock"],
    cleaning: ["Daily tank empty and rinse", "Scheduled waste manifold sanitization", "Drip tray wash-down", "Logged cleaning completion"],
    maintenance: ["Inspect drain slope", "Clean strainer screens", "Check tank seal", "Verify level sensor"],
    openDecisions: ["Sealed tank vs site drain", "Tank capacity", "Odor control approach", "Waste routing service access"],
    handlingSequence: [
      "Receive boba carrier liquid, rinse cycles, flavor purge, nozzle rinse, and drip tray liquid through separate inlets.",
      "Confirm liquid movement through drain or flow sensing after each dispense or cleaning action.",
      "Track tank presence and fill level before allowing customer operation.",
      "Lock out the machine before overflow risk or when mandatory cleaning is overdue.",
      "Guide operator through empty, rinse, reinstall, and cycle-confirm service steps."
    ],
    fluidCircuits: [
      "Boba waste: strainer drain -> check valve -> waste manifold -> tank.",
      "Rinse waste: prep chamber/nozzles/chutes -> sloped drain -> waste manifold -> tank.",
      "Service waste: cleaning solution -> isolated manifold -> tank or plumbed drain."
    ],
    wasteStreams: ["Boba carrier liquid", "Rinse water", "Flavor purge", "Nozzle rinse", "Drip tray spills", "Rejected dispense liquid", "Cleaning solution"],
    validationMetrics: ["Tank capacity per service interval", "Overflow lockout response", "Drain clearing time", "Leak detection coverage", "Odor and residue control"],
    engineeringRisks: ["Waste tank not emptied on time", "Backflow into food-contact area", "Drain blockage causes chamber flooding", "Mixed sugar waste increases microbial load"],
    zone: "Lowest removable waste drawer below prep chamber",
    heightMm: "120-420 mm",
    diameterMm: "Default drain tube inner diameter: 12-16 mm, TO VALIDATE",
    serviceAccess: "Front removable sealed tank with full/installed sensing",
    validationNotes: ["Tank capacity is placeholder until drinks-per-service interval is finalized."],
    planning: planningByModule.waste,
    color: "#fb923c"
  },
  {
    id: "refrigeration",
    name: "Refrigeration Module",
    shortName: "Refrigeration",
    category: "refrigeration",
    status: "Not Started",
    evidence: "ASSUMPTION",
    purpose: "Maintains required temperatures for ingredients, immersed boba cartridges, and chilled water where needed.",
    architecture: "Dedicated cooled bay with thermal monitoring, boba cartridge compatibility review, and serviceable condenser airflow.",
    inputs: ["230V AC", "Thermal load", "Controller setpoint", "Ingredient shelf-life requirements"],
    outputs: ["Chilled storage", "Heat rejection"],
    sensors: ["Cabinet temperature", "Evaporator temperature", "Door switch"],
    actuators: ["Compressor", "Condenser fan", "Evaporator fan"],
    safety: ["Thermal alarm", "Food-safety lockout", "Ventilation clearance"],
    cleaning: ["Condensate management", "Wipeable liner", "Accessible evaporator cover"],
    maintenance: ["Clean condenser", "Verify seals", "Log temperature stability"],
    openDecisions: ["Which ingredients require refrigeration", "Boba carrier liquid storage temperature", "Cooling capacity", "Service access"],
    zone: "Lower-left cooled bay with rear/side airflow",
    heightMm: "360-780 mm",
    diameterMm: "Default fan diameter: 120 mm, TO VALIDATE",
    serviceAccess: "Lower service panel with condenser cleaning clearance",
    validationNotes: ["Cooling volume is assumed until ingredient thermal load is calculated."],
    planning: planningByModule.refrigeration,
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
    zone: "Lower dry bay, separated from drains and ingredient lines",
    heightMm: "250-760 mm",
    serviceAccess: "Locked technician-only side/front panel",
    validationNotes: ["Panel layout must be reviewed for creepage, ingress, and certification path."],
    planning: planningByModule.electrical,
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
    inputs: ["Sensors", "Payment confirmation", "Order queue", "Service commands", "Waste and cleaning state"],
    outputs: ["Motor commands", "Pump commands", "Valve commands", "State telemetry", "Dispense and waste lockouts"],
    sensors: ["All digital and analog machine I/O"],
    actuators: ["Pumps", "Valves", "Motors", "Locks", "Lights"],
    safety: ["Fault state", "E-stop handling", "Cleaning lockout", "Waste overflow lockout", "Watchdog"],
    cleaning: ["Cleaning cycle recipes", "Operator prompts", "Cycle evidence logging", "Drain-confirmed rinse states"],
    maintenance: ["Backup configuration", "Update firmware", "Review error logs"],
    openDecisions: ["PLC vs industrial PC", "I/O margin", "Offline operating mode"],
    zone: "Chest-level HMI and protected controller bay",
    heightMm: "1350-1500 mm screen, 1450-1640 mm controller",
    serviceAccess: "Front HMI access plus technician control drawer",
    validationNotes: ["Chest-height target uses standing-user defaults and should be checked with local user population."],
    planning: planningByModule.controller,
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
    inputs: ["Cup", "Water", "Flavor", "Modifiers", "Gently released boba"],
    outputs: ["Finished beverage", "Waste rinse", "Drip tray waste"],
    sensors: ["Cup position", "Door state", "Splash/leak sensor", "Optional weight sensor", "Drain confirmation"],
    actuators: ["Cup shuttle", "Nozzle valves", "Mixer", "Boba receiving chute", "Pickup door lock"],
    safety: ["Customer separation", "Door lock", "Spill containment", "Drain blockage lockout"],
    cleaning: ["Rinse nozzle", "Drain slope to waste", "Daily wipe-down access", "Post-dose boba chute rinse"],
    maintenance: ["Inspect chamber seal", "Clean drain", "Verify cup alignment"],
    openDecisions: ["Mixing method", "Drain geometry", "Quality check sensor"],
    zone: "Belly-level preparation and pickup chamber",
    heightMm: "950-1100 mm handoff",
    diameterMm: "Default cup clearance diameter: 105 mm, TO VALIDATE",
    serviceAccess: "Front pickup door at no-bend height with wipe-down access",
    validationNotes: ["Pickup height and cup clearance are ergonomic defaults until exact cup sizes are measured."],
    planning: planningByModule.prep,
    color: "#34d399"
  }
];

export const componentBuildPlans: ComponentBuildPlan[] = [
  ...modules.map((module) => ({
    id: module.id,
    name: module.name,
    shortName: module.shortName,
    category: module.category,
    status: module.status,
    evidence: module.evidence,
    purpose: module.purpose,
    color: module.color,
    sourceModuleId: module.id,
    ...(module.planning ?? planningByModule[module.id])
  })),
  {
    id: "frame",
    name: "Frame and Enclosure",
    shortName: "Frame",
    category: "mechanical",
    status: "In Progress",
    evidence: "PROPOSED",
    purpose: "Provides the 1850 x 850 x 800 mm structural envelope, mounting rails, service doors, and modular bay references.",
    color: "#94a3b8",
    estimatedCostInr: { min: 140000, max: 280000 },
    buildDuration: "5-8 weeks",
    peopleNeeded: [
      { role: "Mechanical", count: 1 },
      { role: "Fabrication", count: 2 }
    ],
    assemblyType: "Base chassis and rail skeleton",
    dependencies: ["Final envelope", "Module bay positions", "Service access direction"],
    prototypeDeliverable: "Powder-coated steel or aluminum prototype frame with indexed rails and removable panels.",
    creationSteps: ["Freeze bay coordinates", "Fabricate base frame", "Add vertical rails", "Fit service panels", "Check module slide-in clearance"],
    fitmentNotes: ["All modules register to the frame first.", "Use repeatable datum points so later parts fit like snapped blocks."]
  },
  {
    id: "nozzle-tree",
    name: "Nozzle Tree and Dispense Manifold",
    shortName: "Nozzle Tree",
    category: "food-contact",
    status: "Prototype",
    evidence: "TO VALIDATE",
    purpose: "Combines water, carbonation, flavor, and rinse outlets into a serviceable dispense head above the cup.",
    color: "#22d3ee",
    estimatedCostInr: { min: 55000, max: 120000 },
    buildDuration: "3-5 weeks",
    peopleNeeded: [
      { role: "Fluid systems", count: 1 },
      { role: "Food-contact review", count: 1 }
    ],
    assemblyType: "Drop-in manifold cassette",
    dependencies: ["Prep chamber", "Flavor rack", "Water/carbonation", "Cleaning loop"],
    prototypeDeliverable: "Removable manifold with separated outlets, rinse port, splash target, and quick-disconnect tubing.",
    creationSteps: ["Define outlet spacing", "Machine manifold mount", "Route quick-disconnects", "Add rinse nozzle", "Validate splash pattern"],
    fitmentNotes: ["Mount above the cup centerline.", "Keep service removal possible without dismantling the prep chamber."]
  },
  {
    id: "sensors-actuators",
    name: "Sensors and Actuators Harness",
    shortName: "Sensors",
    category: "control",
    status: "In Progress",
    evidence: "PROPOSED",
    purpose: "Connects cup position, doors, levels, leak sensors, motors, pumps, valves, and locks into the controller map.",
    color: "#14b8a6",
    estimatedCostInr: { min: 70000, max: 150000 },
    buildDuration: "3-6 weeks",
    peopleNeeded: [
      { role: "Electrical", count: 1 },
      { role: "Controls", count: 1 },
      { role: "Mechanical", count: 1 }
    ],
    assemblyType: "Plug-in harness set",
    dependencies: ["Controller I/O", "Electrical panel", "All module sensor locations"],
    prototypeDeliverable: "Labeled harness set with keyed connectors, sensor brackets, and actuator test map.",
    creationSteps: ["Create I/O list", "Select connector families", "Build harness branches", "Label connectors", "Run continuity and I/O test"],
    fitmentNotes: ["Use keyed plugs per module.", "Leave service loops for slide-out modules and door movement."]
  },
  {
    id: "software-hmi",
    name: "Software and Customer HMI",
    shortName: "Software",
    category: "control",
    status: "Not Started",
    evidence: "ASSUMPTION",
    purpose: "Runs order queue, recipe selection, dispense sequence, service lockouts, telemetry, and operator prompts.",
    color: "#818cf8",
    estimatedCostInr: { min: 180000, max: 420000 },
    buildDuration: "6-10 weeks",
    peopleNeeded: [
      { role: "Software", count: 2 },
      { role: "Controls", count: 1 },
      { role: "Product", count: 1 }
    ],
    assemblyType: "HMI software package",
    dependencies: ["Controller platform", "Order flow", "I/O map", "Service procedures"],
    prototypeDeliverable: "Touchscreen order queue demo, dispense state machine, service screens, and fault telemetry.",
    creationSteps: ["Map customer flow", "Build HMI screens", "Implement recipe/state machine", "Add service mode", "Test fault handling"],
    fitmentNotes: ["Keep customer screen at chest level.", "Separate customer mode from technician/service mode."]
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
  { id: "REQ-006", area: "Service", statement: "All food-contact cartridges shall be removable without specialist tools.", priority: "Should", status: "ASSUMPTION", owner: "Mechanical" },
  { id: "REQ-007", area: "Boba", statement: "Popping boba shall remain immersed until dosing and shall be transferred through a low-shear path that avoids auger compression and excessive drop height.", priority: "Must", status: "TO VALIDATE", owner: "Food Contact" },
  { id: "REQ-008", area: "Waste", statement: "Carrier liquid, purge liquid, rinse water, drips, rejected dose liquid, and cleaning solution shall be routed to an isolated waste path with tank-level and overflow lockout.", priority: "Must", status: "PROPOSED", owner: "Fluid Systems" }
];

export const decisions: EngineeringDecision[] = [
  {
    id: "DEC-001",
    title: "Boba dosing mechanism",
    subsystem: "Boba",
    problem: "Select a repeatable dosing method for fragile popping boba without crushing or jamming.",
    options: ["Hybrid drained-weight strainer cup", "Optical pearl counter with singulation", "Gravity gate", "Rotary pocket", "Auger"],
    recommendation: "Hybrid drained-weight strainer cup for v1; keep optical counting as a validation option.",
    reason: "Popping boba is stored in liquid and can rupture under shear, so v1 should separate carrier liquid, verify drained mass, and avoid auger compression.",
    costImpact: "Medium",
    reliabilityImpact: "High",
    foodSafetyImpact: "High",
    manufacturingImpact: "Medium",
    status: "Open"
  },
  {
    id: "DEC-004",
    title: "Waste path architecture",
    subsystem: "Waste",
    problem: "Choose how non-product liquids are separated, measured, and removed without contaminating clean ingredient paths.",
    options: ["Sealed removable tank", "Plumbed site drain", "Hybrid tank plus service drain"],
    recommendation: "Prototype with sealed removable tank and level lockout, then validate plumbed-drain option for commercial pilots.",
    reason: "A sealed tank is easier to prototype and inspect while the final site-install model is still unknown.",
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
  { id: "boba", title: "Boba Portioning", status: "TO VALIDATE", nodes: ["Immersed Cartridge", "Low-Shear Fill", "Strainer Chamber", "Drain Carrier Liquid", "Load-Cell Verify", "Soft Release Chute", "Cup"] },
  { id: "waste", title: "Waste / Drain", status: "PROPOSED", nodes: ["Boba Carrier Liquid", "Rinse / Purge / Drips", "Drain Confirmation", "Waste Manifold", "Sealed Tank", "Level Lockout", "Service Empty"] },
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
  "Waste & Drain Management",
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
