import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { generateRSAKeys } from "../utils/crypto";
import { useState } from "react";
import Spinner from "../chatPage/components/Spinner";

// Validation schema using Yup
const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

  // Mutation for login
  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post("/api/auth/login", data);
      return res.data;
    },
    onSuccess: async (data) => {
      console.log("user details", data._id);
      setLoading(true);
      const privateKey = localStorage.getItem("privateKey");

      if (!privateKey) {
        try {
          const { publicKey, privateKey } = await generateRSAKeys();
          console.log("public key: ", publicKey);
          setLoading(true);
          if (publicKey && privateKey) {
            localStorage.setItem("privateKey", privateKey);
            console.log(" public key:", publicKey);
            console.log(" private key:", privateKey);

            await axios.post("/api/auth/updatePublicKey", {
              userId: data._id,
              publicKey,
            });
          } else {
            toast.warn(
              "Private key missing. A new key pair has been generated."
            );
          }
          setLoading(false);
          // Save the new private key to localStorage
          // localStorage.setItem("privateKey", privateKey);
          // console.log("new public key:", publicKey);
          // console.log("new private key:", privateKey);

          // Send the public key to the backend and update the user record
        } catch (err) {
          toast.error("Key regeneration failed: " + err.message);
          return; // Prevent proceeding if the key generation fails
        }
      }

      //console.log(data);

      localStorage.setItem("authUser", JSON.stringify(data));

      // Log the stored user
      const storedUser = JSON.parse(localStorage.getItem("authUser"));
      console.log("stored User at login:", storedUser);

      // Set the authUser in context
      setAuthUser(data);
      toast.success(data.message);
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Login failed.");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  if (loading) return <Spinner />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">Log In</h1>
        <form className="space-y-6" onSubmit={handleSubmit(mutation.mutate)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              className={`block w-full mt-1 border p-2 rounded-md ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              className={`block w-full mt-1 border p-2 rounded-md ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-md"
          >
            Log in
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
