import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Schools from "./pages/Schools/Schools"
import AddSchool from "./pages/Schools/AddSchool"
import Students from "./pages/Students/Students"
import AddStudents from "./pages/Students/AddStudents"
import Teacher from "./pages/Teachers/Teacher"
import AddTeacher from "./pages/Teachers/AddTeacher"
import "./App.css"
import { ToastContainer } from "react-toastify"
import ActivitiesPage from "./pages/ActivitiesPage"
import Login from "./pages/Login"
import ProtectedRoute from "./pages/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <ActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schools"
          element={
            <ProtectedRoute>
              <Schools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schools/add"
          element={
            <ProtectedRoute>
              <AddSchool />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/add"
          element={
            <ProtectedRoute>
              <AddStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <Teacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/add"
          element={
            <ProtectedRoute>
              <AddTeacher />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </>
  )
}

export default App
