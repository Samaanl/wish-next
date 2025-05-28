// Test script to verify authentication works
// This can be run in browser console to test auth functions

console.log("🧪 Testing Authentication Functions");

// Test email validation
function testEmailValidation() {
  console.log("📧 Testing email validation...");

  const validEmails = [
    "test@example.com",
    "user.test@domain.co.uk",
    "simple@test.org",
  ];

  const invalidEmails = [
    "invalid-email",
    "@domain.com",
    "test@",
    "test@domain",
    "",
  ];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validEmails.forEach((email) => {
    const isValid = emailRegex.test(email);
    console.log(`✅ ${email}: ${isValid ? "VALID" : "INVALID"}`);
  });

  invalidEmails.forEach((email) => {
    const isValid = emailRegex.test(email);
    console.log(`❌ ${email}: ${isValid ? "VALID" : "INVALID"}`);
  });
}

// Test password validation
function testPasswordValidation() {
  console.log("🔒 Testing password validation...");

  const testPasswords = [
    { password: "shortpw", shouldPass: false, reason: "too short" },
    { password: "12345678", shouldPass: false, reason: "no letters" },
    { password: "password123", shouldPass: true, reason: "valid" },
    { password: "MySecure123", shouldPass: true, reason: "valid" },
    { password: "       ", shouldPass: false, reason: "only spaces" },
  ];

  testPasswords.forEach(({ password, shouldPass, reason }) => {
    const trimmed = password.trim();
    const isLongEnough = trimmed.length >= 8;
    const hasLetter = /(?=.*[a-zA-Z])/.test(trimmed);
    const isValid = isLongEnough && hasLetter && trimmed.length > 0;

    const result = isValid === shouldPass ? "✅" : "❌";
    console.log(
      `${result} "${password}" (${reason}): ${isValid ? "PASS" : "FAIL"}`
    );
  });
}

// Test name validation
function testNameValidation() {
  console.log("👤 Testing name validation...");

  const testNames = [
    { name: "John Doe", shouldPass: true },
    { name: "A", shouldPass: false, reason: "too short" },
    { name: "John-Paul O'Connor", shouldPass: true },
    { name: "User123", shouldPass: true },
    { name: "Test<script>", shouldPass: false, reason: "invalid chars" },
    { name: "", shouldPass: false, reason: "empty" },
  ];

  testNames.forEach(({ name, shouldPass, reason = "" }) => {
    const trimmed = name.trim();
    const isLongEnough = trimmed.length >= 2;
    const hasValidChars = /^[a-zA-Z0-9\s\-'.,]+$/.test(trimmed);
    const isValid = isLongEnough && hasValidChars && trimmed.length > 0;

    const result = isValid === shouldPass ? "✅" : "❌";
    console.log(
      `${result} "${name}" ${reason ? `(${reason})` : ""}: ${
        isValid ? "PASS" : "FAIL"
      }`
    );
  });
}

// Run all tests
testEmailValidation();
testPasswordValidation();
testNameValidation();

console.log("🎉 Authentication validation tests completed!");
console.log("💡 To test actual sign-up/sign-in, use the UI in the browser");
