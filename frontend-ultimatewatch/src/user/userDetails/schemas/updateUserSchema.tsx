import { z } from "zod";

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long"),
  
  email: z
    .string()
    .email("Invalid email format"),

  oldPassword: z
    .string(),
  
  password: z
    .string()
    .refine((val) => val === "" || val.length >= 8, "Password must be at least 8 characters long")
    .refine((val) => val === "" || /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(val), "Password is too weak. It must contain at least one uppercase letter, one lowercase letter, and one number or special character")
    .optional(),
  
  confirmPassword: z.string(),
}).refine((data) => {
  if (data.password && data.password !== "") {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
.refine((data) => {
  if (data.password && data.password !== "") {
    return !!data.oldPassword && data.oldPassword !== "";
  }
  return true;
}, {
  message: "Old password is required to set a new one",
  path: ["oldPassword"],
});