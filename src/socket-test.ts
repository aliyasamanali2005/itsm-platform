
import { io } from "socket.io-client";

// ==========================================
// TEST EMPLOYEE
// ==========================================

const EMPLOYEE_ID =
  "6a8bd8e972beeb829b180140";

// ==========================================
// JWT TOKEN
// ==========================================
// Get this token by logging in:
//
// $login = Invoke-RestMethod `
//   -Uri "http://localhost:5000/api/v1/auth/login" `
//   -Method POST `
//   -ContentType "application/json" `
//   -Body '{"email":"sockettest@itsm.com","password":"SocketTest123!"}'
//
// $login.data.token
//
// Paste the returned JWT below.

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOGJkOGU5NzJiZWViODI5YjE4MDE0MCIsImVtYWlsIjoic29ja2V0dGVzdEBpdHNtLmNvbSIsInJvbGUiOiJlbXBsb3llZSIsIm9yZ2FuaXphdGlvbklkIjoiNmE4NTZhMWVhM2NjNzNiMmFhNjQ4MzA0IiwiaWF0IjoxNzg3NTUwNzA3LCJleHAiOjE3ODgxNTU1MDd9.NRhhleDjrpiIytYi4rc9jD3nEQ0kw7eLgiTYalT0DfA";

// ==========================================
// SOCKET CONNECTION
// ==========================================

const socket = io(
  "http://localhost:5000",
  {
    transports: ["websocket"],

    // ========================================
    // SOCKET.IO AUTHENTICATION
    // ========================================
    // The server reads:
    // socket.handshake.auth?.token

    auth: {
      token: TOKEN,
    },
  }
);

// ==========================================
// CONNECT
// ==========================================

socket.on(
  "connect",
  () => {
    console.log(
      "=========================================="
    );

    console.log(
      "Socket test connected"
    );

    console.log(
      "Socket ID:",
      socket.id
    );

    console.log(
      "Authenticated Employee:",
      EMPLOYEE_ID
    );

    console.log(
      "Expected Employee Room:",
      `user:${EMPLOYEE_ID}`
    );

    console.log(
      "=========================================="
    );

    console.log(
      "Waiting for real-time notifications..."
    );
  }
);

// ==========================================
// SOCKET READY
// ==========================================

socket.on(
  "socket-ready",
  (data) => {
    console.log(
      "=========================================="
    );

    console.log(
      "SOCKET READY"
    );

    console.log(
      "User ID:",
      data.userId
    );

    console.log(
      "Organization ID:",
      data.organizationId
    );

    console.log(
      "=========================================="
    );
  }
);

// ==========================================
// REAL-TIME NOTIFICATION
// ==========================================

socket.on(
  "notification:new",
  (notification) => {
    console.log(
      "=========================================="
    );

    console.log(
      "REAL-TIME NOTIFICATION RECEIVED"
    );

    console.log(
      "Notification:",
      notification
    );

    console.log(
      "=========================================="
    );
  }
);

// ==========================================
// DISCONNECT
// ==========================================

socket.on(
  "disconnect",
  (reason) => {
    console.log(
      "=========================================="
    );

    console.log(
      "Socket disconnected:",
      reason
    );

    console.log(
      "=========================================="
    );
  }
);

// ==========================================
// CONNECTION ERROR
// ==========================================

socket.on(
  "connect_error",
  (error) => {
    console.error(
      "=========================================="
    );

    console.error(
      "Socket connection error:",
      error.message
    );

    console.error(
      "=========================================="
    );
  }
);
