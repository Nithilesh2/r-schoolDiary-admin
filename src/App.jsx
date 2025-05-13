import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Schools from "./pages/Schools/Schools"
import AddSchool from "./pages/Schools/AddSchool"
import Students from "./pages/Students/Students"
import AddStudents from "./pages/Students/AddStudents"
import Teacher from "./pages/Teachers/Teacher"
import AddTeacher from "./pages/Teachers/AddTeacher"
import "./App.css"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/schools" element={<Schools />} />
      <Route path="/schools/add" element={<AddSchool />} />
      <Route path="/students" element={<Students />} />
      <Route path="/students/add" element={<AddStudents />} />
      <Route path="/teachers" element={<Teacher />} />
      <Route path="/teachers/add" element={<AddTeacher />} />
    </Routes>
  )
}

export default App
