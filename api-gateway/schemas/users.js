const { z } = require('zod');

const userSchema = z.object({
  email_address: z.string().email("Invalid email address format"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must not exceed 30 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Confirm password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  location: z.string().min(1, "Location is required"),
  role: z.enum(["ADMIN", "CASHIER", "LAND_TITLE_PROCESSOR"], {
    errorMap: () => ({ message: "Role must be ADMIN, CASHIER, or LAND_TITLE_PROCESSOR" })
  })
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

module.exports = {
  userSchema
};