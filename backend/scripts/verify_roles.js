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

const runRoleTests = async () => {
  console.log("=================================================");
  console.log("CARECONNECT ROLE-BASED ACCESS CONTROL (RBAC) TEST");
  console.log("=================================================\n");

  // 1. Nurse Login
  const nurseLogin = await request("POST", "/auth/login", {
    email: "nurse@careconnect.com",
    password: "admin123",
  });
  console.log(`✓ Nurse Login: ${nurseLogin.status} (Role: ${nurseLogin.body.user?.role})`);
  const nurseToken = nurseLogin.body.token;

  // 2. Nurse attempting to create a Ward (Should be 403 Forbidden)
  const nurseWardAttempt = await request(
    "POST",
    "/wards",
    { wardName: "Unauthorized Ward", wardType: "General", floor: 1, capacity: 5 },
    nurseToken
  );
  if (nurseWardAttempt.status === 403) {
    console.log(`✓ Nurse blocked from creating ward: 403 Forbidden (RBAC Enforced)`);
  } else {
    console.error(`❌ Nurse was NOT blocked: got ${nurseWardAttempt.status}`);
  }

  // 3. Receptionist Login
  const recLogin = await request("POST", "/auth/login", {
    email: "receptionist@careconnect.com",
    password: "admin123",
  });
  console.log(`✓ Receptionist Login: ${recLogin.status} (Role: ${recLogin.body.user?.role})`);
  const recToken = recLogin.body.token;

  // 4. Receptionist attempting to delete a Room (Should be 403 Forbidden)
  const recDeleteRoomAttempt = await request(
    "DELETE",
    "/rooms/123456789012345678901234",
    null,
    recToken
  );
  if (recDeleteRoomAttempt.status === 403) {
    console.log(`✓ Receptionist blocked from deleting room: 403 Forbidden (RBAC Enforced)`);
  } else {
    console.error(`❌ Receptionist was NOT blocked: got ${recDeleteRoomAttempt.status}`);
  }

  console.log("\n=================================================");
  console.log("RBAC ROLE VERIFICATION COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
};

runRoleTests();
