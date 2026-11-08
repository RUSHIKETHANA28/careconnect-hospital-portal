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

const runAllRoleTests = async () => {
  console.log("=================================================");
  console.log("CARECONNECT EXTENSIVE 4-ROLE RBAC PERMISSIONS AUDIT");
  console.log("=================================================\n");

  const results = [];
  const testAssert = (desc, condition) => {
    if (condition) {
      console.log(`  ✓ ${desc}`);
      results.push({ desc, passed: true });
    } else {
      console.error(`  ✗ FAILED: ${desc}`);
      results.push({ desc, passed: false });
    }
  };

  // --- 1. SYSTEM ADMIN ---
  console.log(">>> [1/4] Testing Role: System Admin (admin@careconnect.com)...");
  const adminRes = await request("POST", "/auth/login", {
    email: "admin@careconnect.com",
    password: "admin123",
  });
  testAssert("Admin login succeeds (200)", adminRes.status === 200 && adminRes.body.token);
  const adminToken = adminRes.body.token;

  const adminStats = await request("GET", "/dashboard/stats", null, adminToken);
  testAssert("Admin accesses dashboard stats (200)", adminStats.status === 200);

  // --- 2. HOSPITAL ADMINISTRATOR ---
  console.log("\n>>> [2/4] Testing Role: Hospital Administrator (admin.hosp@careconnect.com)...");
  const hospAdminRes = await request("POST", "/auth/login", {
    email: "admin.hosp@careconnect.com",
    password: "admin123",
  });
  testAssert("Hospital Admin login succeeds (200)", hospAdminRes.status === 200 && hospAdminRes.body.token);
  const hospAdminToken = hospAdminRes.body.token;

  const hospAdminStats = await request("GET", "/dashboard/stats", null, hospAdminToken);
  testAssert("Hospital Admin accesses dashboard stats (200)", hospAdminStats.status === 200);

  // Create a ward as Hospital Admin
  const uniqueSuffix = Date.now().toString().slice(-4);
  const wardRes = await request(
    "POST",
    "/wards",
    {
      wardName: `Admin Audit Ward ${uniqueSuffix}`,
      wardType: "General",
      floor: 3,
      capacity: 10,
      description: "RBAC test ward",
    },
    hospAdminToken
  );
  testAssert("Hospital Admin creates ward (201)", wardRes.status === 201);
  const createdWardId = wardRes.body.ward?._id;

  // --- 3. RECEPTIONIST ---
  console.log("\n>>> [3/4] Testing Role: Receptionist (receptionist@careconnect.com)...");
  const recRes = await request("POST", "/auth/login", {
    email: "receptionist@careconnect.com",
    password: "admin123",
  });
  testAssert("Receptionist login succeeds (200)", recRes.status === 200 && recRes.body.token);
  const recToken = recRes.body.token;

  const recStats = await request("GET", "/dashboard/stats", null, recToken);
  testAssert("Receptionist accesses dashboard stats (200)", recStats.status === 200);

  // Receptionist should be BLOCKED from creating a ward
  const recWardBlocked = await request(
    "POST",
    "/wards",
    { wardName: "Illegal Ward", wardType: "ICU", floor: 1, capacity: 5 },
    recToken
  );
  testAssert("Receptionist BLOCKED from creating ward (403)", recWardBlocked.status === 403);

  // Receptionist should be BLOCKED from creating a room
  const recRoomBlocked = await request(
    "POST",
    "/rooms",
    { roomNumber: "999", ward: createdWardId, floor: 1, capacity: 2 },
    recToken
  );
  testAssert("Receptionist BLOCKED from creating room (403)", recRoomBlocked.status === 403);

  // Receptionist should be BLOCKED from creating a bed
  const recBedBlocked = await request(
    "POST",
    "/beds",
    { bedNumber: "B99", room: "123456789012345678901234", ward: createdWardId, bedType: "General" },
    recToken
  );
  testAssert("Receptionist BLOCKED from creating bed (403)", recBedBlocked.status === 403);

  // Receptionist CAN register a patient
  const recPatientRes = await request(
    "POST",
    "/patients",
    {
      name: `Rec Test Patient ${uniqueSuffix}`,
      age: 28,
      gender: "Female",
      phone: "9876543210",
      bloodGroup: "O+",
      address: "123 Health St",
    },
    recToken
  );
  testAssert("Receptionist CAN register patient (201)", recPatientRes.status === 201);
  const createdPatientId = recPatientRes.body.patient?._id;

  // Receptionist BLOCKED from deleting a patient
  const recDeletePatient = await request("DELETE", `/patients/${createdPatientId}`, null, recToken);
  testAssert("Receptionist BLOCKED from deleting patient (403)", recDeletePatient.status === 403);

  // --- 4. NURSE ---
  console.log("\n>>> [4/4] Testing Role: Nurse (nurse@careconnect.com)...");
  const nurseRes = await request("POST", "/auth/login", {
    email: "nurse@careconnect.com",
    password: "admin123",
  });
  testAssert("Nurse login succeeds (200)", nurseRes.status === 200 && nurseRes.body.token);
  const nurseToken = nurseRes.body.token;

  const nurseStats = await request("GET", "/dashboard/stats", null, nurseToken);
  testAssert("Nurse accesses dashboard stats (200)", nurseStats.status === 200);

  // Nurse BLOCKED from creating a ward
  const nurseWardBlocked = await request(
    "POST",
    "/wards",
    { wardName: "Illegal Ward", wardType: "ICU", floor: 1, capacity: 5 },
    nurseToken
  );
  testAssert("Nurse BLOCKED from creating ward (403)", nurseWardBlocked.status === 403);

  // Nurse BLOCKED from registering a patient
  const nursePatientBlocked = await request(
    "POST",
    "/patients",
    { name: "Nurse Patient", age: 30, gender: "Male", phone: "1234567890" },
    nurseToken
  );
  testAssert("Nurse BLOCKED from registering patient (403)", nursePatientBlocked.status === 403);

  // Nurse BLOCKED from creating admissions directly
  const nurseAdmBlocked = await request(
    "POST",
    "/admissions",
    { patient: createdPatientId, bed: "123456789012345678901234", diagnosis: "Fever" },
    nurseToken
  );
  testAssert("Nurse BLOCKED from creating admissions (403)", nurseAdmBlocked.status === 403);

  // Clean up test resources using Admin token
  if (createdWardId) {
    await request("DELETE", `/wards/${createdWardId}`, null, adminToken);
  }
  if (createdPatientId) {
    await request("DELETE", `/patients/${createdPatientId}`, null, adminToken);
  }

  // Final Summary
  const failedCount = results.filter((r) => !r.passed).length;
  console.log("\n=================================================");
  console.log(`RBAC AUDIT COMPLETE: ${results.length - failedCount}/${results.length} Tests Passed`);
  if (failedCount === 0) {
    console.log("✓ ALL 4 USER ROLES FULLY ENFORCED AND FUNCTIONING CORRECTLY!");
  } else {
    console.error(`✗ ${failedCount} test(s) failed!`);
  }
  console.log("=================================================");
  process.exit(failedCount > 0 ? 1 : 0);
};

runAllRoleTests().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
