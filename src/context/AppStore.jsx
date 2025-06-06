/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import { AppContext } from "./AppContext"
import {
  collection,
  onSnapshot,
  query,
  where,
  getCountFromServer,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore"
import { firestore } from "../firebase/firebaseConfig"
import { toast } from "react-toastify"
import { logActivity } from "../utils/logActivity"

const AppStore = ({ children }) => {
  // Toastify
  const options = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  }
  const success = (message) => toast.success(message, options)
  const failure = (message) => toast.error(message, options)
  const [adminDetails, setAdminDetails] = useState({
    uid: "",
    adminType: "",
    schoolId: "",
  })

  useEffect(() => {
    const uid = localStorage.getItem("uid")
    const adminType = localStorage.getItem("userType")
    const schoolId = localStorage.getItem("schoolId")

    setAdminDetails({
      uid: uid || "",
      adminType: adminType || "",
      schoolId: schoolId || "",
    })
  }, [])

  // Sidebar
  const [isOpen, setIsOpen] = useState(true)

  // All Schools
  const [schools, setSchools] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, "schools"),
      async (snapshot) => {
        const schoolData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const school = { id: doc.id, ...doc.data() }

            const studentsQuery = query(
              collection(firestore, "students"),
              where("schoolId", "==", school.id)
            )
            const studentSnap = await getCountFromServer(studentsQuery)
            school.students = studentSnap.data().count

            const teachersQuery = query(
              collection(firestore, "teachers"),
              where("schoolId", "==", school.id)
            )
            const teacherSnap = await getCountFromServer(teachersQuery)
            school.teachers = teacherSnap.data().count

            return school
          })
        )
        setSchools(schoolData)
      }
    )

    return () => unsub()
  }, [])

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(search.toLowerCase())
  )

  // All Teachers
  const [teachers, setTeachers] = useState([])
  const [searchTeacherTerm, setSearchTeacherTerm] = useState("")

  const fetchTeachersWithSchoolNames = async () => {
    try {
      const schoolSnapshot = await getDocs(collection(firestore, "schools"))
      const schoolMap = {}
      schoolSnapshot.docs.forEach((doc) => {
        const schoolData = doc.data()
        schoolMap[doc.id] =
          schoolData.name || schoolData.schoolName || "Unknown"
      })

      const teacherQuery =
        adminDetails.adminType !== "school-admin"
          ? collection(firestore, "teachers")
          : query(
              collection(firestore, "teachers"),
              where("schoolId", "==", adminDetails.schoolId)
            )

      const teacherSnapshot = await getDocs(teacherQuery)
      const teachersWithSchoolName = teacherSnapshot.docs.map((doc) => {
        const data = doc.data()
        const schoolName = schoolMap[data.schoolId] || "Unknown School"
        return {
          id: doc.id,
          ...data,
          schoolName,
        }
      })

      setTeachers(teachersWithSchoolName)
    } catch (error) {
      console.error("Error fetching teachers or schools: ", error)
    }
  }

  useEffect(() => {
    fetchTeachersWithSchoolNames()
  }, [adminDetails])

  const filteredTeachers = teachers.filter((teacher) => {
    const name = teacher.name?.toLowerCase() || ""
    const email = teacher.email?.toLowerCase() || ""
    const school = teacher.schoolName?.toLowerCase() || ""
    const phone = teacher.phone?.toLowerCase() || ""
    return (
      name.includes(searchTeacherTerm) ||
      email.includes(searchTeacherTerm) ||
      school.includes(searchTeacherTerm) ||
      phone.includes(searchTeacherTerm)
    )
  })

  // All Students
  const [students, setStudents] = useState([])
  const [searchStudentTerm, setSearchStudentTerm] = useState("")

  const fetchStudentsWithSchoolNames = async () => {
    try {
      const schoolSnapshot = await getDocs(collection(firestore, "schools"))
      const schoolMap = {}
      schoolSnapshot.docs.forEach((doc) => {
        const schoolData = doc.data()
        schoolMap[doc.id] =
          schoolData.name || schoolData.schoolName || "Unknown"
      })

      const studentQuery =
        adminDetails.adminType !== "school-admin"
          ? collection(firestore, "students")
          : query(
              collection(firestore, "students"),
              where("schoolId", "==", adminDetails.schoolId)
            )

      const studentSnapshot = await getDocs(studentQuery)
      const studentsWithSchoolName = studentSnapshot.docs.map((doc) => {
        const data = doc.data()
        const schoolName = schoolMap[data.schoolId] || "Unknown School"
        return {
          id: doc.id,
          ...data,
          schoolName,
        }
      })

      setStudents(studentsWithSchoolName)
    } catch (error) {
      console.error("Error fetching students or schools: ", error)
    }
  }

  useEffect(() => {
    fetchStudentsWithSchoolNames()
  }, [adminDetails])

  const filteredStudents = students.filter((student) => {
    const name = student.studentName?.toLowerCase() || ""
    const admissionNumber = student.admissionNumber?.toLowerCase() || ""
    const school = student.schoolName?.toLowerCase() || ""
    const fatherName = student.parents?.father?.name?.toLowerCase() || ""
    return (
      name.includes(searchStudentTerm) ||
      admissionNumber.includes(searchStudentTerm) ||
      school.includes(searchStudentTerm) ||
      fatherName.includes(searchStudentTerm)
    )
  })

  // Delete Teacher
  const handleDeleteTeacher = async (teacher) => {
    if (!teacher?.id) return
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${teacher.name} `
    )
    if (!confirmDelete) return
    try {
      await deleteDoc(doc(firestore, "teachers", teacher.id))
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id))
      await logActivity(
        "Successfully deleted teacher",
        adminDetails.adminType !== "school-admin" ? "Admin" : "School Admin"
      )
      success("Teacher deleted successfully")
    } catch (error) {
      failure(`error getting deleting ${error}`)
    }
  }

  const formatIndianNumber = (value) => {
    if (!value) return ""
    const x = value.replace(/[^0-9]/g, "")
    const lastThree = x.slice(-3)
    const otherNumbers = x.slice(0, -3)
    return otherNumbers
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree
  }

  return (
    <AppContext.Provider
      value={{
        adminDetails,
        setAdminDetails,
        formatIndianNumber,

        // Toastify
        success,
        failure,

        //Sidebar
        setIsOpen,
        isOpen,

        // All Schhols
        setSearch,
        search,
        filteredSchools,
        schools,
        setSchools,

        // All Teachers
        setTeachers,
        teachers,
        filteredTeachers,
        setSearchTeacherTerm,
        searchTeacherTerm,

        // All Students
        filteredStudents,
        setSearchStudentTerm,
        searchStudentTerm,
        students,
        fetchStudentsWithSchoolNames,

        // Delete Teacher
        handleDeleteTeacher,
        fetchTeachersWithSchoolNames,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppStore
