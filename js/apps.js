/* Scenario data for every simulated interface on the site.
   These are illustrative representations, not captures: each one shows how
   Cerebro would narrow an app down to the tools a goal needs.
   status: "available" (works today), "planned" (on the roadmap), "concept". */
(function () {
  "use strict";

  // UI spec strings: "Label" tool chip · "#Label" icon chip · "=Label|Value" field
  // ">Label" tree row · "~#hex" swatch · "/Title" section heading · "-" spacer
  var APPS = [
    {
      id: "blender", name: "Blender", kind: "3D modeling", tint: "#e8862e",
      status: "available", statusText: "Available today · Blender plugin (verified)",
      doc: "Blender · mug.blend",
      layout: { menu: [0, 0, 100, 5.5], tools: [0, 5.5, 100, 6.5], left: [0, 12, 5.5, 70], right: [77, 12, 23, 70], bottom: [0, 82, 100, 18], canvas: [5.5, 12, 71.5, 70] },
      focus: [0, 0, 67, 100],
      ui: {
        menu: ["File", "Edit", "Render", "Window", "Help", "-", "Layout", "Modeling", "Sculpting", "UV Editing", "Texture Paint", "Shading", "Animation", "Rendering", "Compositing", "Geometry Nodes", "Scripting"],
        tools: ["Object Mode", "View", "Select", "Add", "Object", "#Global", "#Pivot", "Snap", "#Snap Target", "Proportional", "#Falloff", "Cylinder", "Torus", "Area Light", "Camera", "#Overlays", "#X-Ray", "#Solid", "#Material", "#Rendered"],
        left: ["#Select Box", "#Cursor", "#Move", "#Rotate", "#Scale", "#Transform", "#Annotate", "#Measure", "#Extrude", "Inset Faces", "#Bevel", "#Loop Cut", "#Knife", "#Poly Build", "#Spin", "#Smooth", "#Shear", "#Rip"],
        right: ["/Outliner", ">Scene Collection", ">Collection", ">Camera", ">Cube", ">Light", "/Properties", "#Render", "#Output", "#View Layer", "#Scene", "#World", "#Object", "#Modifiers", "#Particles", "#Physics", "#Constraints", "#Data", "#Material",
          "=Location X|0 m", "=Location Y|0 m", "=Location Z|0 m", "=Rotation X|0°", "=Rotation Y|0°", "=Rotation Z|0°", "=Scale|1.000", "Solidify", "Subdivision", "Mirror", "Bevel", "Shade Smooth", "Keyframe", "Follow Path", "World Color", "=Delta Transform|", "=Relations|", "=Visibility|", "=Viewport Display|"],
        bottom: { timeline: true, items: ["Playback", "Keying", "View", "Marker", "#Jump Start", "#Play", "#Jump End", "=Start|1", "=End|250", "Insert Keyframe", "Play Animation"] }
      },
      goals: [
        {
          goal: "Model a coffee mug", title: "Coffee mug", art: "mug",
          interp: "A mug is a cylinder, hollowed out, with a handle. Cerebro keeps the five tools that build that shape and hides the rest of Blender’s 1,207 operations.",
          steps: [
            { c: "Cylinder", label: "Add a cylinder", phase: "Start", trust: "verified", did: "Added a cylinder." },
            { c: "Inset Faces", label: "Inset the top", phase: "Build", trust: "verified", did: "Inset the top face." },
            { c: "Solidify", label: "Give it walls", phase: "Build", trust: "verified", did: "Added wall thickness." },
            { c: "Torus", label: "Add the handle", phase: "Build", trust: "verified", did: "Added a torus handle." },
            { c: "Shade Smooth", label: "Shade smooth", phase: "Finish", trust: "verified", did: "Smoothed the surface." }
          ]
        },
        {
          goal: "Light a product shot", title: "Product lighting", art: "light",
          interp: "Good product light is a soft key light, a clean backdrop and a camera. Cerebro keeps lighting and render tools and clears away modeling.",
          steps: [
            { c: "Area Light", label: "Add a soft light", phase: "Start", trust: "verified", did: "Added an area light." },
            { c: "World Color", label: "Set the backdrop", phase: "Build", trust: "verified", did: "Set a dark studio backdrop." },
            { c: "Camera", label: "Place the camera", phase: "Build", trust: "verified", did: "Placed a camera." },
            { c: "#Rendered", label: "Preview the render", phase: "Review", trust: "verified", did: "Switched to the rendered preview." }
          ]
        },
        {
          goal: "Animate a camera orbit", title: "Camera orbit", art: "orbit",
          interp: "An orbit is a camera that follows a circle over time. Cerebro keeps the camera, path and keyframe tools and the timeline you need to play it.",
          steps: [
            { c: "Camera", label: "Add a camera", phase: "Start", trust: "verified", did: "Added a camera." },
            { c: "Follow Path", label: "Follow a circle", phase: "Build", trust: "verified", did: "Camera now follows a circle." },
            { c: "Insert Keyframe", label: "Set keyframes", phase: "Build", trust: "verified", did: "Keyframed frames 1 and 250." },
            { c: "Play Animation", label: "Play it", phase: "Review", trust: "verified", did: "Playing the orbit." }
          ]
        }
      ],
      keywords: /mug|cup|3d|model|blender|sculpt|render|light|orbit|camera|animat/
    },
    {
      id: "resolve", name: "DaVinci Resolve", kind: "Video editing", tint: "#4fb0c6",
      status: "planned", statusText: "Planned integration · not available yet",
      doc: "DaVinci Resolve · Short film",
      layout: { menu: [0, 0, 100, 5.5], tools: [0, 5.5, 100, 6], left: [0, 11.5, 19, 46], right: [76, 11.5, 24, 46], bottom: [0, 57.5, 100, 42.5], canvas: [19, 11.5, 57, 46] },
      focus: [0, 0, 67, 74],
      ui: {
        menu: ["DaVinci Resolve", "File", "Edit", "Trim", "Timeline", "Clip", "Mark", "View", "Playback", "Fusion", "Color", "Fairlight", "Workspace", "Help"],
        tools: ["Media Pool", "Effects", "Edit Index", "Sound Library", "#Mixer", "#Metadata", "Inspector", "Media", "Cut", "Edit", "#Fusion page", "Color", "Fairlight", "Deliver"],
        left: ["/Master", ">Footage", ">Audio", ">Graphics", ">Timelines", "Import Media", "#Clip 01", "#Clip 02", "#Clip 03", "#Clip 04", "#Clip 05", "#Clip 06", "#Clip 07", "#Clip 08", "#Clip 09"],
        right: ["/Inspector", "#Video", "#Audio", "#Effect", "#Transition", "=Zoom|1.000", "=Position X|0.000", "=Position Y|0.000", "=Rotation|0.000", "=Anchor X|0.000", "=Pitch|0.000", "=Yaw|0.000", "=Crop Left|0", "=Crop Right|0", "=Opacity|100", "=Composite|Normal", "=Speed|100%", "=Stabilization|Off", "=Lens Correction|0", "=Retime|Project"],
        bottom: { timeline: true, tracks: 4, items: ["#Selection", "Trim", "#Dynamic Trim", "Blade", "#Insert", "#Overwrite", "#Replace", "#Snapping", "#Linked", "#Flags", "#Marker", "=Timecode|01:00:12:04"] }
      },
      goals: [{
        goal: "Edit a cinematic short film", title: "Short film edit", art: "film",
        interp: "Editing a short is import, cut, trim, grade, mix and export, in that order. Cerebro would line those up and hide the other pages until you need them.",
        steps: [
          { c: "Import Media", label: "Import footage", phase: "Start", trust: "planned", did: "Imported 9 clips." },
          { c: "Blade", label: "Cut clips", phase: "Build", trust: "planned", did: "Cut the clips on the beat." },
          { c: "Trim", label: "Trim the edit", phase: "Build", trust: "planned", did: "Tightened the edit." },
          { c: "Color", label: "Color grade", phase: "Style", trust: "planned", did: "Applied a warm grade." },
          { c: "Fairlight", label: "Balance audio", phase: "Review", trust: "planned", did: "Balanced dialogue and music." },
          { c: "Deliver", label: "Export the film", phase: "Finish", trust: "planned", did: "Exported 1080p H.264." }
        ]
      }],
      keywords: /film|video|edit(ing)? (a )?(movie|film|video|clip)|resolve|davinci|footage|timeline|cut/
    },
    {
      id: "photoshop", name: "Photoshop", kind: "Photo editing", tint: "#31a8ff",
      status: "planned", statusText: "Planned integration · not available yet",
      doc: "Photoshop · portrait.psd",
      layout: { menu: [0, 0, 100, 5.5], tools: [0, 5.5, 100, 6], left: [0, 11.5, 5.5, 88.5], right: [74, 11.5, 26, 88.5], bottom: [5.5, 95, 68.5, 5], canvas: [5.5, 11.5, 68.5, 83.5] },
      focus: [0, 0, 67, 100],
      ui: {
        menu: ["Photoshop", "File", "Edit", "Image", "Layer", "Type", "Select", "Filter", "3D", "View", "Plugins", "Window", "Help"],
        tools: ["#Home", "#Move", "Auto-Select", "Layer", "#Transform Controls", "#Align Left", "#Align Center", "#Align Right", "#Distribute", "#3D Mode", "Select Subject", "Select and Mask", "Export As"],
        left: ["#Move tool", "#Artboard", "#Marquee", "#Lasso", "#Object Selection", "#Quick Selection", "#Magic Wand", "#Crop", "#Frame", "#Eyedropper", "#Spot Healing", "Brush", "#Clone Stamp", "#History Brush", "#Eraser", "#Gradient", "#Blur", "#Dodge", "#Pen", "#Type tool", "#Path Selection", "#Rectangle", "#Hand", "#Zoom"],
        right: ["/Color", "~#e0243f", "~#f2a33a", "~#e8e1c9", "~#5aa7d9", "~#3a3f8f", "~#1d1d1d", "/Properties", "Remove Background", "Add Mask", "=Feather|0 px", "=Density|100%", "/Adjustments", "#Brightness", "#Levels", "#Curves", "#Exposure", "#Vibrance", "#Hue", "#Color Balance", "#Black & White", "#Photo Filter", "#Channel Mixer", "/Layers", ">Background", ">Layer 1", "=Opacity|100%", "=Fill|100%"],
        bottom: { items: ["=Zoom|66.67%", "=Doc|24.9M/24.9M"] }
      },
      goals: [{
        goal: "Remove the background from a photo", title: "Background removal", art: "cutout",
        interp: "Removing a background is select the subject, refine the edge, mask, check, export with transparency. Cerebro would keep exactly those.",
        steps: [
          { c: "Select Subject", label: "Select the subject", phase: "Start", trust: "planned", did: "Selected the subject." },
          { c: "Select and Mask", label: "Refine the edges", phase: "Build", trust: "planned", did: "Refined the hair edge." },
          { c: "Add Mask", label: "Mask the background", phase: "Build", trust: "planned", did: "Masked out the background." },
          { c: "Brush", label: "Touch up the mask", phase: "Review", trust: "planned", did: "Cleaned up the mask." },
          { c: "Export As", label: "Export as PNG", phase: "Finish", trust: "planned", did: "Exported a transparent PNG." }
        ]
      }],
      keywords: /background|cut ?out|remove .*background|photoshop|mask|subject/
    },
    {
      id: "numbers", name: "Numbers", kind: "Spreadsheets", tint: "#4cc76a",
      status: "available", statusText: "Available today · macOS Accessibility",
      doc: "Numbers · Budget",
      layout: { menu: [0, 0, 100, 5.5], tools: [0, 5.5, 100, 9], left: [0, 14.5, 13, 79], right: [76, 14.5, 24, 79], bottom: [0, 93.5, 100, 6.5], canvas: [13, 14.5, 63, 79] },
      focus: [0, 0, 67, 100],
      ui: {
        menu: ["Numbers", "File", "Edit", "Insert", "Table", "Organize", "Format", "Arrange", "View", "Share", "Window", "Help"],
        tools: ["#View", "#Zoom", "Add Category", "#Pivot Table", "#Insert", "Table", "Chart", "#Text", "#Shape", "#Media", "#Comment", "#Collaborate", "#Format", "#Organize"],
        left: ["/Sheets", ">Budget", ">Sheet 2", ">Sheet 3", "/Templates", ">Personal", ">Business", ">Education"],
        right: ["/Format", "#Table", "#Cell", "#Text", "#Arrange", "/Table Styles", "~#4cc76a", "~#2c82c9", "~#e0a33a", "~#8a5bd6", "~#d9534f", "~#9a9a9a", "=Headers|1", "=Footer|0", "=Table Name|On", "=Caption|Off", "=Font Size|11", "=Outline|On", "=Gridlines|On", "=Alternating Rows|Off", "/Data Format", "Currency", "=Decimals|2", "=Separator|On", "=Accounting|Off"],
        bottom: { items: ["SUM", "=AVERAGE|", "=MIN|", "=MAX|", "=COUNT|"] }
      },
      goals: [{
        goal: "Create a monthly budget", title: "Monthly budget", art: "budget",
        interp: "A budget is a table of categories, a total, currency formatting and a chart to see it. Cerebro keeps those and hides the rest of the Format sidebar.",
        steps: [
          { c: "Table", label: "New table", phase: "Start", trust: "live", did: "Inserted a table." },
          { c: "Add Category", label: "Group categories", phase: "Build", trust: "live", did: "Grouped rows by category." },
          { c: "SUM", label: "Total it", phase: "Build", trust: "live", did: "Added a SUM total." },
          { c: "Currency", label: "Format as currency", phase: "Style", trust: "live", did: "Formatted as currency." },
          { c: "Chart", label: "Insert a chart", phase: "Review", trust: "live", did: "Inserted a bar chart." }
        ]
      }],
      keywords: /budget|spreadsheet|table|numbers|excel|expense|finance|money|chart/
    },
    {
      id: "photopea", name: "Photopea", kind: "Web photo editor", tint: "#18a497",
      status: "available", statusText: "Available today · Chrome extension",
      doc: "Photopea · photo.jpg",
      layout: { menu: [0, 0, 100, 5.5], tools: [0, 5.5, 100, 6], left: [0, 11.5, 5.5, 88.5], right: [75, 11.5, 25, 88.5], bottom: [5.5, 95, 69.5, 5], canvas: [5.5, 11.5, 69.5, 83.5] },
      focus: [0, 0, 67, 100],
      ui: {
        menu: ["File", "Edit", "Image", "Layer", "Select", "Filter", "View", "Window", "More", "Account"],
        tools: ["Open", "Auto-Select", "#Transform controls", "#Distances", "#Align L", "#Align C", "#Align R", "#Align T", "#Align M", "#Align B", "Aspect Ratio", "Export as"],
        left: ["#Move", "#Marquee", "#Lasso", "#Magic Wand", "Crop", "#Slice", "#Eyedropper", "#Healing", "#Brush", "#Clone", "#Eraser", "#Gradient", "#Blur", "#Sponge", "#Pen", "#Type", "#Path select", "#Shape", "#Hand", "#Zoom"],
        right: ["/History", ">Open", ">Layer via Copy", "/Swatches", "~#e0243f", "~#ffb347", "~#ffe066", "~#6cc795", "~#4fb0c6", "~#7a6cd9", "/Adjustments", "Brightness/Contrast", "#Levels", "#Curves", "#Exposure", "#Hue/Saturation", "#Vibrance", "#Color Balance", "/Layers", ">Background", "=Opacity|100%", "=Fill|100%", "/Properties", "/Character", "/Paragraph"],
        bottom: { items: ["=Zoom|50%", "=Size|4032×3024"] }
      },
      goals: [{
        goal: "Crop and adjust a photograph", title: "Crop and adjust", art: "photo",
        interp: "Your photo is already open. Cropping and adjusting it is crop, set a ratio, lift the light, export, so Cerebro keeps those four and fades the rest of the editor.",
        steps: [
          { c: "Crop", label: "Crop tool", phase: "Start", trust: "live", did: "Switched on the crop tool." },
          { c: "Aspect Ratio", label: "Set 4:5 ratio", phase: "Build", trust: "guide", did: "You set a 4:5 ratio." },
          { c: "Brightness/Contrast", label: "Brighten it", phase: "Style", trust: "guide", did: "You lifted the brightness." },
          { c: "Export as", label: "Export JPG", phase: "Finish", trust: "guide", did: "You exported a JPG." }
        ]
      }],
      keywords: /crop|photo|picture|image|photopea|brighten|adjust/
    },
    {
      id: "excalidraw", name: "Excalidraw", kind: "Diagrams", tint: "#8f86ff",
      status: "available", statusText: "Available today · Chrome extension",
      doc: "Excalidraw · Untitled",
      layout: { menu: [0, 0, 100, 7], tools: [18, 7, 64, 8], left: [0, 15, 18, 70], right: [82, 7, 18, 30], bottom: [0, 90, 100, 10], canvas: [0, 15, 100, 75] },
      focus: [0, 0, 67, 100],
      ui: {
        menu: ["#Menu", "Library", "Share", "#Live collaboration", "#Theme", "#Help", "Export image"],
        tools: ["#Lock", "#Hand", "#Selection", "Rectangle", "Diamond", "#Ellipse", "Arrow", "#Line", "#Draw", "Text", "#Image", "#Eraser", "#Frame", "#Embed", "#Laser", "#More tools"],
        left: ["/Stroke", "~#1e1e1e", "~#e03131", "~#2f9e44", "~#1971c2", "~#f08c00", "/Background", "~#ffffff", "~#ffc9c9", "~#b2f2bb", "~#a5d8ff", "~#ffec99", "=Fill|Hachure", "=Stroke width|Thin", "=Stroke style|Solid", "=Sloppiness|Artist", "=Edges|Round", "=Opacity|100", "/Layers", "#Back", "#Backward", "#Forward", "#Front"],
        right: ["/Library", "#Item 1", "#Item 2", "#Item 3", "#Item 4"],
        bottom: { items: ["#Zoom out", "=Zoom|100%", "#Zoom in", "#Undo", "#Redo", "#Help"] }
      },
      goals: [{
        goal: "Create a flowchart", title: "Flowchart", art: "flow",
        interp: "A flowchart is boxes, decisions, arrows and labels. Excalidraw is already lean, so Cerebro just fades the styling and library tools you won't touch.",
        steps: [
          { c: "Rectangle", label: "Draw steps", phase: "Start", trust: "live", did: "Drew the step boxes." },
          { c: "Diamond", label: "Add a decision", phase: "Build", trust: "live", did: "Added a decision diamond." },
          { c: "Arrow", label: "Connect with arrows", phase: "Build", trust: "live", did: "Connected the shapes." },
          { c: "Text", label: "Label everything", phase: "Style", trust: "live", did: "Labelled each shape." },
          { c: "Export image", label: "Export PNG", phase: "Finish", trust: "guide", did: "You exported a PNG." }
        ]
      }],
      keywords: /flow ?chart|diagram|whiteboard|excalidraw|sketch|wireframe|mind ?map/
    },
    {
      id: "fusion", name: "Fusion", kind: "CAD", tint: "#f0a02a",
      status: "concept", statusText: "Concept · not on the roadmap yet",
      doc: "Fusion · phone-stand v1",
      layout: { menu: [0, 0, 100, 5.5], tools: [0, 5.5, 100, 12], left: [0, 17.5, 16, 70], right: [80, 17.5, 20, 70], bottom: [0, 87.5, 100, 12.5], canvas: [16, 17.5, 64, 70] },
      focus: [0, 0, 67, 100],
      ui: {
        menu: ["File", "#Save", "#Undo", "#Redo", "Design", "Solid", "Surface", "Mesh", "Form", "Sheet Metal", "Plastic", "Utilities", "Manage", "Export"],
        tools: ["Create Sketch", "Extrude", "#Revolve", "#Sweep", "#Loft", "#Rib", "#Web", "#Emboss", "#Hole", "#Thread", "#Box", "#Cylinder", "#Sphere", "#Torus", "#Coil", "#Pipe", "#Press Pull", "Fillet", "#Chamfer", "#Shell", "#Draft", "#Scale", "#Combine", "Rotate", "#Joint", "#Plane", "#Axis", "#Measure", "#Interference", "#Insert", "#Select"],
        left: ["/Browser", ">Document Settings", ">Named Views", ">Origin", ">Analysis", ">Sketches", ">Bodies", ">Canvases", ">Components"],
        right: ["/Sketch Palette", "=Look At|", "=Sketch Grid|On", "=Snap|On", "=Slice|Off", "=Profile|On", "=Points|On", "=Dimensions|On", "=Constraints|On", "=Projected|On", "=Construction|Off", "=3D Sketch|Off"],
        bottom: { timeline: true, items: ["#Start", "#Back", "#Play", "#Forward", "#End", "#Orbit", "#Pan", "#Zoom", "#Fit", "#Display", "#Grid"] }
      },
      goals: [{
        goal: "Design a phone stand", title: "Phone stand", art: "stand",
        interp: "A phone stand is a side profile, extruded, tilted to a viewing angle, softened, then exported for printing. That's five tools out of hundreds.",
        steps: [
          { c: "Create Sketch", label: "Sketch the profile", phase: "Start", trust: "concept", did: "Sketched the side profile." },
          { c: "Extrude", label: "Extrude it", phase: "Build", trust: "concept", did: "Extruded to 70 mm." },
          { c: "Rotate", label: "Set the angle", phase: "Build", trust: "concept", did: "Tilted to 65°." },
          { c: "Fillet", label: "Round the edges", phase: "Style", trust: "concept", did: "Filleted every edge." },
          { c: "Export", label: "Export for print", phase: "Finish", trust: "concept", did: "Exported an STL." }
        ]
      }],
      keywords: /cad|stand|bracket|print|fusion|tinkercad|part|enclosure|design a/
    },
    {
      id: "textedit", name: "TextEdit", kind: "Documents", tint: "#c9ccd1",
      status: "available", statusText: "Available today · macOS Accessibility",
      doc: "TextEdit · Letter.rtf",
      layout: { menu: [0, 0, 100, 5.5], tools: [0, 5.5, 100, 7], left: [0, 12.5, 24, 87.5], right: [74, 12.5, 26, 87.5], bottom: [24, 95, 50, 5], canvas: [24, 12.5, 50, 82.5] },
      focus: [0, 0, 67, 100],
      ui: {
        menu: ["TextEdit", "File", "Edit", "Format", "View", "Window", "Help", "New"],
        tools: ["=Style|Body", "=Font|Helvetica", "=Typeface|Regular", "Font Size", "#Text color", "#Highlight", "#Bold", "#Italic", "#Underline", "#Align left", "#Center", "#Align right", "#Justify", "=Spacing|1.0", "#Lists"],
        left: ["/Fonts", "=Collection|All Fonts", ">Avenir", ">Baskerville", ">Futura", ">Georgia", ">Helvetica", ">Menlo", ">Optima", ">Palatino", ">Times", "=Size|12"],
        right: ["/Format", "Make Rich Text", "#Make Plain Text", "#Allow Hyphenation", "#Prevent Editing", "#Wrap to Page", "Show Ruler", "#Copy Ruler", "#Paste Ruler", "#Lists…", "#Tables…", "#Writing Direction", "#Spelling", "#Substitutions", "#Transformations", "#Speech", "Export as PDF"],
        bottom: { items: ["=Words|0", "=Page|1 of 1"] }
      },
      goals: [{
        goal: "Write a professional letter", title: "Professional letter", art: "letter",
        interp: "A letter needs a page, rich text, a ruler for margins, a readable size and a PDF to send. The font panel and format menus can go.",
        steps: [
          { c: "New", label: "New document", phase: "Start", trust: "live", did: "Opened a new document." },
          { c: "Make Rich Text", label: "Rich text", phase: "Start", trust: "live", did: "Switched to rich text." },
          { c: "Show Ruler", label: "Show the ruler", phase: "Build", trust: "live", did: "Showed the ruler." },
          { c: "Font Size", label: "Set the size", phase: "Style", trust: "guide", did: "You set 12 pt body, 20 pt heading." },
          { c: "Export as PDF", label: "Export as PDF", phase: "Finish", trust: "live", did: "Exported a PDF." }
        ]
      }],
      keywords: /letter|write|document|essay|cover letter|memo|textedit|pages|resume|cv/
    }
  ];

  /* ---------- illustrative previews: layers shown from state `f` to `t` ---------- */
  var G = '<defs>'
    + '<linearGradient id="gMetal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3b40"/><stop offset=".35" stop-color="#cfd0d3"/><stop offset=".55" stop-color="#f4f4f2"/><stop offset="1" stop-color="#55575c"/></linearGradient>'
    + '<linearGradient id="gFlat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6c6d71"/><stop offset="1" stop-color="#8d8e92"/></linearGradient>'
    + '<linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3442"/><stop offset="1" stop-color="#6b5a4a"/></linearGradient>'
    + '<linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4d66"/><stop offset="1" stop-color="#8f1024"/></linearGradient>'
    + '<pattern id="pCheck" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d9d9d9"/><rect width="5" height="5" fill="#bdbdbd"/><rect x="5" y="5" width="5" height="5" fill="#bdbdbd"/></pattern>'
    + '<pattern id="pGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#2a2a2f" stroke-width=".6"/></pattern>'
    + '</defs>';

  function viewport() {
    return '<rect width="400" height="250" fill="#1d1d21"/>'
      + '<g stroke="#2c2c31" stroke-width=".7">' + [40, 80, 120, 160, 200, 240, 280, 320, 360].map(function (x) { return '<line x1="' + x + '" y1="140" x2="' + (200 + (x - 200) * 3) + '" y2="250"/>'; }).join("")
      + [150, 166, 188, 218].map(function (y) { return '<line x1="0" y1="' + y + '" x2="400" y2="' + y + '"/>'; }).join("") + '</g>'
      + '<line x1="0" y1="186" x2="400" y2="186" stroke="#7a2e36" stroke-width=".8"/><line x1="214" y1="140" x2="176" y2="250" stroke="#4d6b2f" stroke-width=".8"/>';
  }

  var ART = {
    mug: {
      base: viewport(),
      layers: [
        { f: 0, t: 0, s: '<g transform="translate(200 150)"><path d="M-34 -18 L0 -36 L34 -18 L34 22 L0 40 L-34 22Z" fill="#8d8e92"/><path d="M-34 -18 L0 0 L34 -18 L0 -36Z" fill="#b6b7ba"/><path d="M0 0 L34 -18 L34 22 L0 40Z" fill="#6c6d71"/><path d="M-34 -18 L0 -36 L34 -18 L34 22 L0 40 L-34 22Z" fill="none" stroke="#f0a24a" stroke-width="1.2"/></g>' },
        { f: 1, t: 4, s: '<g transform="translate(200 150)"><path d="M-40 -30 L-40 30 A40 13 0 0 0 40 30 L40 -30Z" fill="url(#gFlat)"/><ellipse cx="0" cy="-30" rx="40" ry="13" fill="#a9aaae"/></g>' },
        { f: 5, t: 99, s: '<g transform="translate(200 150)"><path d="M-40 -30 L-40 30 A40 13 0 0 0 40 30 L40 -30Z" fill="url(#gMetal)"/><ellipse cx="0" cy="-30" rx="40" ry="13" fill="#d9dadc"/></g>' },
        { f: 2, t: 99, s: '<ellipse cx="200" cy="120" rx="33" ry="10" fill="#4b4c50" stroke="#e0243f" stroke-width="1"/>' },
        { f: 3, t: 99, s: '<ellipse cx="200" cy="121" rx="31" ry="8.5" fill="#141417"/>' },
        { f: 4, t: 99, s: '<path d="M240 132 C 270 128 272 172 240 170" fill="none" stroke="#8d8e92" stroke-width="9" stroke-linecap="round"/><path d="M240 132 C 270 128 272 172 240 170" fill="none" stroke="#b9babd" stroke-width="3" stroke-linecap="round"/>' },
        { f: 1, t: 99, s: '<path d="M160 120 L160 180 A40 13 0 0 0 240 180 L240 120" fill="none" stroke="#e0243f" stroke-width="1" opacity=".55"/>' }
      ]
    },
    light: {
      base: viewport(),
      layers: [
        { f: 0, t: 99, s: '<g transform="translate(200 160)"><path d="M-30 -15 L0 -30 L30 -15 L30 18 L0 33 L-30 18Z" fill="#7d7e82"/><path d="M-30 -15 L0 0 L30 -15 L0 -30Z" fill="#a9aaae"/><path d="M0 0 L30 -15 L30 18 L0 33Z" fill="#5f6064"/></g>' },
        { f: 1, t: 99, s: '<rect x="150" y="30" width="100" height="10" rx="2" fill="#f4f4f2"/><path d="M150 40 L110 150 L290 150 L250 40Z" fill="#ffffff" opacity=".07"/>' },
        { f: 2, t: 99, s: '<path d="M40 210 Q 200 130 360 210 L360 250 L40 250Z" fill="#0d0d10"/><rect width="400" height="250" fill="#000" opacity=".25"/>' },
        { f: 3, t: 99, s: '<g transform="translate(330 70)" stroke="#e0243f" fill="none" stroke-width="1.4"><rect x="-14" y="-9" width="22" height="18" rx="2"/><path d="M8 -6 L20 -12 L20 12 L8 6Z"/></g><path d="M316 76 L230 150" stroke="#e0243f" stroke-dasharray="3 3" stroke-width=".8"/>' },
        { f: 4, t: 99, s: '<g transform="translate(200 160)"><path d="M-30 -15 L0 -30 L30 -15 L30 18 L0 33 L-30 18Z" fill="#b2b3b6"/><path d="M-30 -15 L0 0 L30 -15 L0 -30Z" fill="#eeeeec"/><path d="M0 0 L30 -15 L30 18 L0 33Z" fill="#8a8b8f"/></g><ellipse cx="200" cy="198" rx="44" ry="8" fill="#000" opacity=".45"/>' }
      ]
    },
    orbit: {
      base: viewport(),
      layers: [
        { f: 0, t: 99, s: '<g transform="translate(200 150)"><path d="M-30 -15 L0 -30 L30 -15 L30 18 L0 33 L-30 18Z" fill="#7d7e82"/><path d="M-30 -15 L0 0 L30 -15 L0 -30Z" fill="#a9aaae"/><path d="M0 0 L30 -15 L30 18 L0 33Z" fill="#5f6064"/></g>' },
        { f: 1, t: 99, s: '<g transform="translate(300 96)" stroke="#e0243f" fill="none" stroke-width="1.4"><rect x="-14" y="-9" width="22" height="18" rx="2"/><path d="M8 -6 L20 -12 L20 12 L8 6Z"/></g>' },
        { f: 2, t: 99, s: '<ellipse cx="200" cy="150" rx="110" ry="40" fill="none" stroke="#e0243f" stroke-width="1" stroke-dasharray="4 4"/>' },
        { f: 3, t: 99, s: '<g fill="#e0243f"><path d="M90 150 l5 -5 l5 5 l-5 5z"/><path d="M300 150 l5 -5 l5 5 l-5 5z"/></g>' },
        { f: 4, t: 99, s: '<path d="M300 150 A110 40 0 0 1 200 190" fill="none" stroke="#ff4d66" stroke-width="2.2"/><circle cx="200" cy="190" r="3.4" fill="#ff4d66"/>' }
      ]
    },
    film: {
      base: '<rect width="400" height="250" fill="#0b0b0d"/><rect x="40" y="22" width="320" height="180" fill="#121216" stroke="#26262b"/>',
      layers: [
        { f: 1, t: 99, s: '<rect x="40" y="22" width="320" height="180" fill="url(#gSky)"/><path d="M40 160 L110 110 L160 140 L230 90 L300 138 L360 112 L360 202 L40 202Z" fill="#1c1a1f"/><circle cx="300" cy="70" r="16" fill="#f0c48a" opacity=".85"/>' },
        { f: 2, t: 99, s: '<g stroke="#e0243f" stroke-width="1.2"><line x1="120" y1="212" x2="120" y2="238"/><line x1="205" y1="212" x2="205" y2="238"/><line x1="290" y1="212" x2="290" y2="238"/></g>' },
        { f: 3, t: 99, s: '<g fill="#3a3f8f" opacity=".8"><rect x="40" y="214" width="78" height="10"/><rect x="122" y="214" width="81" height="10"/><rect x="207" y="214" width="81" height="10"/><rect x="292" y="214" width="68" height="10"/></g>' },
        { f: 4, t: 99, s: '<rect x="40" y="22" width="320" height="180" fill="#ff8a3d" opacity=".16"/><rect x="40" y="22" width="320" height="180" fill="#0a6d7a" opacity=".10" style="mix-blend-mode:screen"/>' },
        { f: 5, t: 99, s: '<path d="M40 232 ' + Array.apply(null, Array(64)).map(function (_, i) { return "L" + (40 + i * 5) + " " + (232 + Math.round(Math.sin(i * 1.7) * 3 + Math.sin(i * .5) * 2)); }).join(" ") + '" fill="none" stroke="#6cc795" stroke-width="1"/>' },
        { f: 6, t: 99, s: '<rect x="130" y="100" width="140" height="28" rx="6" fill="#070708" opacity=".85"/><text x="200" y="118" fill="#ecebe7" font-size="10" text-anchor="middle" font-family="system-ui">Exported · 1080p</text>' }
      ]
    },
    cutout: {
      base: '<rect width="400" height="250" fill="#18181b"/>',
      layers: [
        { f: 0, t: 2, s: '<rect x="90" y="20" width="220" height="210" fill="url(#gSky)"/><path d="M90 170 L150 120 L200 150 L260 110 L310 150 L310 230 L90 230Z" fill="#2b2a2f"/>' },
        { f: 3, t: 99, s: '<rect x="90" y="20" width="220" height="210" fill="url(#pCheck)"/>' },
        { f: 0, t: 99, s: '<g><circle cx="200" cy="105" r="34" fill="#c99b82"/><path d="M166 98 C 160 60 240 60 234 98 C 230 80 172 80 166 98Z" fill="#2d211d"/><path d="M140 230 C 140 170 260 170 260 230Z" fill="#2f3a4a"/></g>' },
        { f: 1, t: 2, s: '<path d="M140 230 C 138 180 168 160 168 140 C 156 128 160 70 200 66 C 240 70 244 128 232 140 C 232 160 262 180 260 230" fill="none" stroke="#fff" stroke-width="1.3" stroke-dasharray="4 3"/>' },
        { f: 2, t: 2, s: '<path d="M166 96 C 158 62 242 62 234 96" fill="none" stroke="#e0243f" stroke-width="2.4" opacity=".7"/>' },
        { f: 4, t: 99, s: '<circle cx="246" cy="182" r="7" fill="none" stroke="#e0243f" stroke-width="1.4"/>' },
        { f: 5, t: 99, s: '<rect x="270" y="28" width="34" height="16" rx="4" fill="#e0243f"/><text x="287" y="39.5" fill="#fff" font-size="8" text-anchor="middle" font-family="system-ui">PNG</text>' }
      ]
    },
    budget: {
      base: '<rect width="400" height="250" fill="#f4f4f2"/><rect width="400" height="250" fill="url(#pGrid)" opacity=".12"/>',
      layers: [
        { f: 1, t: 99, s: '<g font-family="system-ui" font-size="9" fill="#3a3b40"><rect x="30" y="26" width="200" height="16" fill="#4cc76a" opacity=".22"/><text x="36" y="37" font-weight="600">Category</text><text x="160" y="37" font-weight="600">Amount</text>'
          + [0, 1, 2, 3, 4].map(function (i) { return '<line x1="30" y1="' + (58 + i * 18) + '" x2="230" y2="' + (58 + i * 18) + '" stroke="#d0d0cc"/>'; }).join("") + '</g>' },
        { f: 2, t: 99, s: '<g font-family="system-ui" font-size="9" fill="#3a3b40">' + ["Rent", "Groceries", "Transport", "Utilities", "Savings"].map(function (n, i) { return '<text x="36" y="' + (54 + i * 18) + '">' + n + "</text>"; }).join("") + "</g>" },
        { f: 2, t: 3, s: '<g font-family="system-ui" font-size="9" fill="#3a3b40">' + ["1200", "420", "160", "140", "300"].map(function (n, i) { return '<text x="160" y="' + (54 + i * 18) + '">' + n + "</text>"; }).join("") + "</g>" },
        { f: 3, t: 99, s: '<g font-family="system-ui" font-size="9" fill="#111"><rect x="30" y="140" width="200" height="16" fill="#e0243f" opacity=".1"/><text x="36" y="151" font-weight="600">Total</text></g>' },
        { f: 3, t: 3, s: '<text x="160" y="151" font-family="system-ui" font-size="9" font-weight="600" fill="#111">2220</text>' },
        { f: 4, t: 99, s: '<g font-family="system-ui" font-size="9" fill="#3a3b40">' + ["$1,200.00", "$420.00", "$160.00", "$140.00", "$300.00"].map(function (n, i) { return '<text x="160" y="' + (54 + i * 18) + '">' + n + "</text>"; }).join("") + '<text x="160" y="151" font-weight="600" fill="#111">$2,220.00</text></g>' },
        { f: 5, t: 99, s: '<g transform="translate(258 40)"><rect width="118" height="120" rx="6" fill="#fff" stroke="#dcdcd8"/>' + [60, 21, 8, 7, 15].map(function (h, i) { return '<rect x="' + (12 + i * 21) + '" y="' + (104 - h * 1.4) + '" width="14" height="' + (h * 1.4) + '" rx="2" fill="' + (i === 0 ? "#e0243f" : "#4cc76a") + '"/>'; }).join("") + "</g>" }
      ]
    },
    photo: {
      base: '<rect width="400" height="250" fill="#1b1b1e"/>',
      layers: [
        { f: 0, t: 2, s: '<g opacity=".8"><rect x="60" y="25" width="280" height="200" fill="url(#gSky)"/><path d="M60 170 L120 120 L170 150 L240 100 L300 150 L340 130 L340 225 L60 225Z" fill="#26252a"/><circle cx="270" cy="70" r="18" fill="#f0c48a"/></g>' },
        { f: 3, t: 99, s: '<rect x="60" y="25" width="280" height="200" fill="url(#gSky)"/><path d="M60 170 L120 120 L170 150 L240 100 L300 150 L340 130 L340 225 L60 225Z" fill="#3a383f"/><circle cx="270" cy="70" r="18" fill="#ffd9a3"/>' },
        { f: 1, t: 1, s: '<rect x="60" y="25" width="280" height="200" fill="none" stroke="#fff" stroke-width="1.2"/><g stroke="#fff" stroke-width=".5" opacity=".6"><line x1="153" y1="25" x2="153" y2="225"/><line x1="247" y1="25" x2="247" y2="225"/><line x1="60" y1="92" x2="340" y2="92"/><line x1="60" y1="158" x2="340" y2="158"/></g>' },
        { f: 2, t: 99, s: '<path d="M60 25 H340 V225 H60Z M120 25 V225 H280 V25Z" fill="#000" fill-rule="evenodd" opacity=".55"/><rect x="120" y="25" width="160" height="200" fill="none" stroke="#e0243f" stroke-width="1.4"/>' },
        { f: 4, t: 99, s: '<rect x="292" y="32" width="38" height="16" rx="4" fill="#e0243f"/><text x="311" y="43.5" fill="#fff" font-size="8" text-anchor="middle" font-family="system-ui">JPG</text>' }
      ]
    },
    flow: {
      base: '<rect width="400" height="250" fill="#f7f6f2"/>',
      layers: [
        { f: 1, t: 99, s: '<g fill="none" stroke="#1e1e1e" stroke-width="1.6"><rect x="40" y="100" width="80" height="44" rx="8"/><rect x="280" y="40" width="80" height="44" rx="8"/><rect x="280" y="160" width="80" height="44" rx="8"/></g>' },
        { f: 2, t: 99, s: '<path d="M200 82 L240 122 L200 162 L160 122Z" fill="#ffc9c9" stroke="#1e1e1e" stroke-width="1.6"/>' },
        { f: 3, t: 99, s: '<g fill="none" stroke="#1e1e1e" stroke-width="1.4"><path d="M120 122 H158"/><path d="M228 108 L278 66"/><path d="M228 136 L278 178"/></g><g fill="#1e1e1e"><path d="M158 122 l-6 -3 v6z"/><path d="M278 66 l-6 1 l3 5z"/><path d="M278 178 l-6 -1 l3 -5z"/></g>' },
        { f: 4, t: 99, s: '<g font-family="Virgil, Comic Sans MS, cursive" font-size="10" fill="#1e1e1e" text-anchor="middle"><text x="80" y="126">Order in</text><text x="200" y="126">In stock?</text><text x="320" y="66">Ship it</text><text x="320" y="186">Restock</text></g>' },
        { f: 5, t: 99, s: '<rect x="330" y="12" width="38" height="16" rx="4" fill="#e0243f"/><text x="349" y="23.5" fill="#fff" font-size="8" text-anchor="middle" font-family="system-ui">PNG</text>' }
      ]
    },
    stand: {
      base: '<rect width="400" height="250" fill="#e9ecef"/><g stroke="#c9ced4" stroke-width=".6">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (i) { return '<line x1="' + (i * 40) + '" y1="0" x2="' + (i * 40) + '" y2="250"/><line x1="0" y1="' + (i * 25) + '" x2="400" y2="' + (i * 25) + '"/>'; }).join("") + "</g>",
      layers: [
        { f: 1, t: 1, s: '<path d="M120 190 L280 190 L280 178 L170 178 L230 80 L218 74 L150 178 L120 178Z" fill="none" stroke="#1971c2" stroke-width="1.6"/>' },
        { f: 2, t: 2, s: '<path d="M120 190 L280 190 L280 178 L170 178 L230 80 L218 74 L150 178 L120 178Z" fill="#9fb3c8" stroke="#3a5470" stroke-width="1.2"/><path d="M280 190 L300 176 L300 164 L280 178Z M230 80 L250 66 L238 60 L218 74Z" fill="#7f95ab"/>' },
        { f: 3, t: 3, s: '<path d="M120 194 L280 194 L280 182 L178 182 L248 92 L237 84 L156 182 L120 182Z" fill="#9fb3c8" stroke="#3a5470" stroke-width="1.2"/><path d="M280 194 L300 180 L300 168 L280 182Z M248 92 L268 78 L257 70 L237 84Z" fill="#7f95ab"/>' },
        { f: 4, t: 99, s: '<path d="M126 194 Q120 194 120 188 L120 186 Q120 182 126 182 L156 182 L235 86 Q240 82 245 86 L247 88 Q250 92 247 95 L178 182 L274 182 Q280 182 280 188 Q280 194 274 194Z" fill="#9fb3c8" stroke="#3a5470" stroke-width="1.2"/><path d="M280 190 L300 176 L300 170 L280 184Z M247 92 L266 79 L262 73 L244 86Z" fill="#7f95ab"/>' },
        { f: 5, t: 99, s: '<rect x="322" y="14" width="38" height="16" rx="4" fill="#e0243f"/><text x="341" y="25.5" fill="#fff" font-size="8" text-anchor="middle" font-family="system-ui">STL</text>' }
      ]
    },
    letter: {
      base: '<rect width="400" height="250" fill="#d8d8d4"/>',
      layers: [
        { f: 1, t: 99, s: '<rect x="110" y="14" width="180" height="236" fill="#fff"/>' },
        { f: 2, t: 99, s: '<g fill="#1d1d1f"><rect x="130" y="34" width="70" height="6" rx="1"/><rect x="130" y="46" width="44" height="3" rx="1" fill="#9a9a9a"/></g>' },
        { f: 3, t: 99, s: '<g><rect x="110" y="14" width="180" height="8" fill="#f1f1ef"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return '<line x1="' + (124 + i * 19) + '" y1="16" x2="' + (124 + i * 19) + '" y2="20" stroke="#9a9a9a" stroke-width=".6"/>'; }).join("") + '<path d="M130 22 l-3 -4 h6z M270 22 l-3 -4 h6z" fill="#e0243f"/></g>' },
        { f: 3, t: 99, s: '<g fill="#b9b9b5">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<rect x="130" y="' + (82 + i * 10 + (i > 4 ? 8 : 0)) + '" width="' + (i === 4 || i === 9 ? 90 : 140) + '" height="3.4" rx="1"/>'; }).join("") + "</g>" },
        { f: 4, t: 99, s: '<rect x="130" y="62" width="104" height="9" rx="1.5" fill="#1d1d1f"/>' },
        { f: 5, t: 99, s: '<rect x="246" y="24" width="34" height="16" rx="4" fill="#e0243f"/><text x="263" y="35.5" fill="#fff" font-size="8" text-anchor="middle" font-family="system-ui">PDF</text>' }
      ]
    }
  };

  var artCount = 0;
  function artSVG(key) {
    var a = ART[key], n = ++artCount;
    // show the whole drawing at any canvas shape; its background colour bleeds to the edges
    var bg = (/fill="(#[0-9a-fA-F]{3,6})"/.exec(a.base) || [0, "#1d1d21"])[1];
    var svg = '<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet" style="overflow:visible" aria-hidden="true">' + G
      + '<rect x="-3000" y="-3000" width="6400" height="6250" fill="' + bg + '"/>' + a.base
      + a.layers.map(function (l) { return '<g data-f="' + l.f + '" data-t="' + l.t + '">' + l.s + "</g>"; }).join("") + "</svg>";
    // every copy gets its own gradient/pattern ids, so hidden copies can't break visible ones
    return svg.replace(/id="(\w+)"/g, 'id="$1-a' + n + '"').replace(/url\(#(\w+)\)/g, "url(#$1-a" + n + ")");
  }

  function find(id) { for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i]; return null; }

  function matchGoal(text, appId) {
    var q = (text || "").toLowerCase().trim();
    if (!q) return null;
    var pool = appId ? [find(appId)] : APPS;
    for (var i = 0; i < pool.length; i++) {
      var app = pool[i];
      for (var g = 0; g < app.goals.length; g++) {
        var goal = app.goals[g], words = goal.goal.toLowerCase().split(/\W+/).filter(function (w) { return w.length > 3; });
        var hits = words.filter(function (w) { return q.indexOf(w) >= 0; }).length;
        if (hits >= 2 || q === goal.goal.toLowerCase()) return { app: app, goal: goal };
      }
    }
    for (var j = 0; j < pool.length; j++) if (pool[j].keywords.test(q)) return { app: pool[j], goal: null };
    return null;
  }

  window.CerebroApps = { list: APPS, find: find, art: artSVG, matchGoal: matchGoal };
})();
