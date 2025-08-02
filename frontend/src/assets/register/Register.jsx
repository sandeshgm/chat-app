import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { generateRSAKeys } from "../utils/crypto";
import Spinner from "../chatPage/components/Spinner";

const schema = yup
  .object({
    fullname: yup.string().required("Name is required"),
    username: yup.string().required("Username is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup
      .string()
      .matches(/^(?=.*\d)(?=.*[a-zA-Z]).{5,}$/, {
        message: "Please create a strong password!",
      })
      .required("Password is required"),
    gender: yup
      .string()
      .oneOf(["male", "female"], "Gender is required")
      .required("Gender is required"),
  })
  .required();

export default function Register() {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post("/api/auth/register", data);
      return res.data;
    },
    onSuccess: async (data) => {
      try {
        toast.success(data?.message);

        localStorage.setItem("authUser", JSON.stringify(data));
        setAuthUser(data);

        setLoading(true);
        // Navigate to login
        setTimeout(() => {
          navigate("/login");
        }, 1000);
        //navigate("/login");
      } catch (err) {
        toast.error(
          "Failed to save keys: " + (err.response?.data?.message || err.message)
        );
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Registration failed!");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (formData) => {
    try {
      const { publicKey, privateKey } = await generateRSAKeys();
      localStorage.setItem("privateKey", privateKey);

      const payload = { ...formData, publicKey };

      mutation.mutate(payload);
    } catch (err) {
      toast.error("Key generation failed: " + err.message);
    }
  };

  if (loading) return <Spinner message="Redirecting to login..." />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">Register</h1>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Fullname */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              className={`block w-full px-3 py-2 mt-1 border rounded-lg shadow-sm sm:text-sm ${
                errors.fullname ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Your Name"
              {...register("fullname")}
            />
            {errors.fullname && (
              <p className="mt-2 text-sm text-red-600">
                {errors.fullname.message}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              className={`block w-full px-3 py-2 mt-1 border rounded-lg shadow-sm sm:text-sm ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Your Username"
              {...register("username")}
            />
            {errors.username && (
              <p className="mt-2 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className={`block w-full px-3 py-2 mt-1 border rounded-lg shadow-sm sm:text-sm ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="your@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className={`block w-full px-3 py-2 mt-1 border rounded-lg shadow-sm sm:text-sm ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              className={`block w-full px-3 py-2 mt-1 border rounded-lg shadow-sm sm:text-sm ${
                errors.gender ? "border-red-500" : "border-gray-300"
              }`}
              {...register("gender")}
              s
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && (
              <p className="mt-2 text-sm text-red-600">
                {errors.gender.message}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              {mutation.isLoading ? "Signing Up..." : "Register"}
            </button>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
