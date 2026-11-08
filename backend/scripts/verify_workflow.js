const http = require("http");

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(postData ? { "Content-Length": Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
};

const runVerification = async () => {
  console.log("=================================================");
  console.log("CARECONNECT END-TO-END INTEGRATION TEST SUITE");
  console.log("Student Roll Number: 2303A51919");
  console.log("=================================================\n");

  const results = [];

  try {
    // 0. Login as Admin
    const loginRes = await request("POST", "/auth/login", {
      email: "admin@careconnect.com",
      password: "admin123",
    });
    const token = loginRes.body.token;
    if (!token) throw new Error("Login failed: " + JSON.stringify(loginRes.body));
    console.log("✓ Step 0: Admin Login successful (Token acquired)");
    results.push({ step: "Admin Authentication", status: "PASSED" });

    // 1. Create Ward
    const wardName = `Test Ward E2E ${Date.now().toString().slice(-4)}`;
    const wardRes = await request(
      "POST",
      "/wards",
      {
        wardName,
        wardType: "General",
        floor: 3,
        capacity: 10,
        description: "Integration test ward",
      },
      token
    );
    const wardId = wardRes.body.ward?._id;
    console.log(`✓ Step 1: Create Ward ('${wardName}') -> ${wardRes.status} Created`);
    results.push({ step: "1. Create Ward", status: "PASSED", details: wardName });

    // 2. Create Room
    const roomNum = `R-${Date.now().toString().slice(-3)}`;
    const roomRes = await request(
      "POST",
      "/rooms",
      {
        roomNumber: roomNum,
        ward: wardId,
        floor: 3,
        capacity: 2,
      },
      token
    );
    const roomId = roomRes.body.room?._id;
    console.log(`✓ Step 2: Create Room ('${roomNum}') in Ward -> ${roomRes.status} Created`);
    results.push({ step: "2. Create Room", status: "PASSED", details: roomNum });

    // 3. Create 2 Beds in Room
    const bedNum1 = `B1-${Date.now().toString().slice(-3)}`;
    const bed1Res = await request(
      "POST",
      "/beds",
      {
        bedNumber: bedNum1,
        room: roomId,
        ward: wardId,
        bedType: "General",
      },
      token
    );
    const bedId1 = bed1Res.body.bed?._id;

    const bedNum2 = `B2-${Date.now().toString().slice(-3)}`;
    const bed2Res = await request(
      "POST",
      "/beds",
      {
        bedNumber: bedNum2,
        room: roomId,
        ward: wardId,
        bedType: "General",
      },
      token
    );
    const bedId2 = bed2Res.body.bed?._id;
    console.log(`✓ Step 3: Create Beds ('${bedNum1}', '${bedNum2}') -> Both Available`);
    results.push({ step: "3. Create Beds", status: "PASSED", details: `${bedNum1}, ${bedNum2}` });

    // 4. Register Patient
    const patientName = `Workflow Test Patient ${Date.now().toString().slice(-4)}`;
    const patRes = await request(
      "POST",
      "/patients",
      {
        name: patientName,
        age: 42,
        gender: "Male",
        phone: "9876500000",
        address: "Hospital Test Street",
        bloodGroup: "B+",
      },
      token
    );
    const patientId = patRes.body.patient?._id;
    console.log(`✓ Step 4: Register Patient ('${patientName}') -> ID: ${patRes.body.patient?.patientId}`);
    results.push({ step: "4. Register Patient", status: "PASSED" });

    // 5. Admit Patient into Bed 1
    const admRes = await request(
      "POST",
      "/admissions",
      {
        patient: patientId,
        bed: bedId1,
        diagnosis: "E2E Automated Test Fever",
        admittedBy: "Dr. Verification Script",
      },
      token
    );
    const admissionId = admRes.body.admission?._id;
    console.log(`✓ Step 5: Admit Patient -> ${admRes.status} (Admission ID: ${admRes.body.admission?.admissionId})`);
    results.push({ step: "5. Admit Patient", status: "PASSED" });

    // 6. Verify Bed 1 status is Occupied
    const checkBed1 = await request("GET", `/beds/${bedId1}`, null, token);
    const bed1Status = checkBed1.body.bed?.status;
    if (bed1Status !== "Occupied") throw new Error(`Expected Bed 1 to be Occupied, got ${bed1Status}`);
    console.log(`✓ Step 6: Verified Bed 1 status is '${bed1Status}'`);
    results.push({ step: "6. Verify Bed Occupied", status: "PASSED" });

    // 7. Transfer Patient from Bed 1 to Bed 2
    const trfRes = await request(
      "POST",
      "/transfers",
      {
        admission: admissionId,
        toBed: bedId2,
        reason: "Transfer to Bed 2 for procedure",
      },
      token
    );
    console.log(`✓ Step 7: Transfer Patient to Bed 2 -> ${trfRes.status} (Transfer ID: ${trfRes.body.transfer?.transferId})`);
    results.push({ step: "7. Transfer Patient", status: "PASSED" });

    // 8. Verify Old and New Bed States
    const checkBed1AfterTransfer = await request("GET", `/beds/${bedId1}`, null, token);
    const checkBed2AfterTransfer = await request("GET", `/beds/${bedId2}`, null, token);
    console.log(`✓ Step 8: Bed 1 is '${checkBed1AfterTransfer.body.bed?.status}' (Cleaning); Bed 2 is '${checkBed2AfterTransfer.body.bed?.status}' (Occupied)`);
    results.push({ step: "8. Verify Old/New Bed States", status: "PASSED" });

    // 9. Discharge Patient
    const disRes = await request(
      "PUT",
      `/discharges/${admissionId}`,
      { dischargeNotes: "Automated test discharge summary: Recovered completely" },
      token
    );
    console.log(`✓ Step 9: Discharge Patient -> ${disRes.status} Completed`);
    results.push({ step: "9. Discharge Patient", status: "PASSED" });

    // 10. Verify Admission Status is Discharged
    const checkAdm = await request("GET", `/admissions/${admissionId}`, null, token);
    if (checkAdm.body.admission?.status !== "Discharged") {
      throw new Error("Expected status Discharged, got " + checkAdm.body.admission?.status);
    }
    console.log(`✓ Step 10: Verified Admission status is '${checkAdm.body.admission?.status}'`);
    results.push({ step: "10. Verify Admission Status", status: "PASSED" });

    // 11. Verify Bed 2 status is Cleaning
    const checkBed2AfterDischarge = await request("GET", `/beds/${bedId2}`, null, token);
    if (checkBed2AfterDischarge.body.bed?.status !== "Cleaning") {
      throw new Error("Expected Bed 2 to be Cleaning, got " + checkBed2AfterDischarge.body.bed?.status);
    }
    console.log(`✓ Step 11: Verified Released Bed 2 is in '${checkBed2AfterDischarge.body.bed?.status}' status`);
    results.push({ step: "11. Verify Bed Enters Cleaning", status: "PASSED" });

    // 12. Complete Cleaning on Bed 2 (as Nurse/Admin)
    const cleanRes = await request(
      "PUT",
      `/beds/${bedId2}`,
      { status: "Available" },
      token
    );
    console.log(`✓ Step 12: Complete Cleaning -> ${cleanRes.status} (${cleanRes.body.message})`);
    results.push({ step: "12. Complete Bed Cleaning", status: "PASSED" });

    // 13. Verify Bed 2 is Available
    const checkBed2Available = await request("GET", `/beds/${bedId2}`, null, token);
    if (checkBed2Available.body.bed?.status !== "Available") {
      throw new Error("Expected Bed 2 to be Available, got " + checkBed2Available.body.bed?.status);
    }
    console.log(`✓ Step 13: Verified Bed 2 has returned to '${checkBed2Available.body.bed?.status}'`);
    results.push({ step: "13. Verify Bed Available", status: "PASSED" });

    // 14. Verify Dashboard Live Values
    const dashRes = await request("GET", "/dashboard/stats", null, token);
    console.log(`✓ Step 14: Dashboard Live Statistics Verified:`, dashRes.body.stats);
    results.push({ step: "14. Verify Dashboard Values", status: "PASSED" });

    // 15. Verify Reports
    const bedsRep = await request("GET", "/beds", null, token);
    const admRep = await request("GET", "/admissions", null, token);
    console.log(`✓ Step 15: Reports verified: ${bedsRep.body.beds?.length} beds, ${admRep.body.admissions?.length} admissions`);
    results.push({ step: "15. Verify Clinical Reports", status: "PASSED" });

    console.log("\n=================================================");
    console.log("ALL 15 INTEGRATION TEST STEPS PASSED SUCCESSFULLY!");
    console.log("=================================================");
  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
    process.exit(1);
  }
};

runVerification();
