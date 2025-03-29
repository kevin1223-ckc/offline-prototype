// Show different sections dynamically
function showSection(sectionId) {
    document.querySelectorAll("div[id$='Section']").forEach(section => section.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");

    if (sectionId === "recordsSection") {
        loadRecords();
    }
}

// QR Code Scanner
let scanner;
let lastScannedLRN = ""; // ✅ Stores last scanned LRN
let lastScanTime = 0; // ✅ Tracks the time of the last scan

function startScanner() {
    if (scanner) {
        scanner.stop().then(() => scanner.clear());
    }

    scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" }, // Uses back camera
        { fps: 10, qrbox: 250 },
        qrCodeMessage => {
            let mode = document.getElementById("scanMode").value;
            let timestamp = new Date().toLocaleString();
            let [name, lrn] = qrCodeMessage.split(",");

            if (!name || !lrn) {
                console.warn("Invalid QR Code format!");
                return;
            }

            let currentTime = Date.now();
            if (lrn === lastScannedLRN && (currentTime - lastScanTime) < 3000) {
                console.warn("Duplicate scan ignored.");
                return; // ✅ Ignore duplicate scans within 3 seconds
            }

            // ✅ Update last scanned details
            lastScannedLRN = lrn;
            lastScanTime = currentTime;

            let record = { name, lrn, mode, timestamp };
            let records = JSON.parse(localStorage.getItem("attendanceRecords")) || [];
            records.push(record);
            localStorage.setItem("attendanceRecords", JSON.stringify(records));

            // ✅ Show scanned details instead of alert
            let scanResult = document.getElementById("scanResult");
            scanResult.innerHTML = `<b>Scanned:</b> ${name} (${lrn}) - ${mode} at ${timestamp}`;

            loadRecords(); // Refresh the records list
        },
        error => console.warn("Scanning...") // Logs scanning attempts
    ).catch(err => {
        console.error("Error starting scanner:", err);
    });
}

function stopScanner() {
    if (scanner) {
        scanner.stop().then(() => scanner.clear());
    }
    lastScannedLRN = ""; // ✅ Reset last scanned data when stopping scanner
}



// Generate ID
function generateID() {
    let name = document.getElementById("studentName").value;
    let lrn = document.getElementById("studentLRN").value;
    let guardian = document.getElementById("parentGuardian").value;
    let address = document.getElementById("address").value;
    let contact = document.getElementById("contactInfo").value;
    let birthday = document.getElementById("birthday").value;
    let grade = document.getElementById("gradeLevel").value;
    let imgFile = document.getElementById("studentImage").files[0];

    if (!name || !lrn || !imgFile ) {
        alert("Please fill in all required fields!");
        return;
    }

    // Update Text Fields in ID
    document.getElementById("previewName").textContent = name;
    document.getElementById("previewLRN").textContent = `LRN: ${lrn}`;
    document.getElementById("previewGuardian").textContent = guardian;
    document.getElementById("previewAddress").textContent = `Address: ${address}`;
    document.getElementById("previewContact").textContent = contact;
    document.getElementById("previewBirthday").textContent = birthday;
    document.getElementById("previewGradeLevel").textContent = grade;
   

    // Generate QR Code
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), {
        text: `${name},${lrn}`,
        width: 100,
        height: 100
    });

    // Load and Display Image
    let reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById("previewPhoto").src = e.target.result;
    };
    reader.readAsDataURL(imgFile);
}

// Download ID as an image
function downloadID() {
    let studentName = document.getElementById("studentName").value.trim();
    if (!studentName) {
        alert("Please enter a student name before downloading.");
        return;
    }

    let idContainer = document.getElementById("idContainer");
    let buttons = document.querySelectorAll("button"); // Select all buttons to hide

    // Hide buttons before capturing
    buttons.forEach(button => button.style.visibility = "hidden");

    // Get actual ID size
    let width = idContainer.clientWidth;
    let height = idContainer.clientHeight;

    // Ensure all images are loaded before capturing
    let images = idContainer.getElementsByTagName("img");
    let promises = Array.from(images).map(img => new Promise(resolve => {
        if (img.complete) resolve();
        else {
            img.onload = resolve;
            img.onerror = resolve;
        }
    }));

    Promise.all(promises).then(() => {
        html2canvas(idContainer, {
            width: width,  // Set width to match ID
            height: height, // Set height to match ID
            scale: 2, // Maintain high quality (adjust if needed)
            useCORS: true,
            backgroundColor: null
        }).then(canvas => {
            let link = document.createElement("a");
            link.href = canvas.toDataURL("image/png", 1.0);
            link.download = `${studentName.replace(/\s+/g, "_")}.png`;
            link.click();

            // Show buttons again after capture
            buttons.forEach(button => button.style.visibility = "visible");
        });
    });
}









// Update file label for image upload
function updateFileLabel() {
    let fileInput = document.getElementById("studentImage");
    let fileLabel = document.getElementById("fileLabel");
    fileLabel.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : "No file selected";
}

function viewRecords() {
    document.getElementById("recordsSection").classList.remove("hidden"); // Show the records section
    loadRecords(); // Load and display attendance records
}

// Function to Export Attendance Records to Excel
function exportToExcel() {
    let records = JSON.parse(localStorage.getItem("attendanceRecords")) || [];
    
    if (records.length === 0) {
        alert("No records to export!");
        return;
    }

    // Convert data to worksheet format
    let worksheet = XLSX.utils.json_to_sheet(records);

    // Create a new workbook and append the worksheet
    let workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Records");

    // Save the workbook as an Excel file
    XLSX.writeFile(workbook, "Attendance_Records.xlsx");
}


// Load attendance records
function loadRecords() {
    let records = JSON.parse(localStorage.getItem("attendanceRecords")) || [];
    let recordBody = document.getElementById("recordBody");
    recordBody.innerHTML = "";

    records.forEach(record => {
        let row = `<tr>
            <td>${record.name}</td>
            <td>${record.lrn}</td>
            <td>${record.timestamp}</td>
            <td>${record.mode}</td>
        </tr>`;
        recordBody.innerHTML += row;
    });
}

// Clear attendance records
function clearRecords() {
    localStorage.removeItem("attendanceRecords");
    loadRecords();
}
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
        .then(() => console.log("✅ Service Worker Registered!"))
        .catch((err) => console.log("❌ SW Registration Failed:", err));
}
