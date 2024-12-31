// src/services/axiosInstance.service.js
import axios from "axios";

export const API_URL = "http://localhost:3030/api";

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
