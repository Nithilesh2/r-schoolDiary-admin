import { useEffect, useState } from "react"
import { AppContext } from "./AppContext"
import {
  collection,
  onSnapshot,
  query,
  where,
  getCountFromServer,
  getDocs,
} from "firebase/firestore"
import { firestore } from "../firebase/firebaseConfig"

const AppStore = ({ children }) => {
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

  useEffect(() => {
    const fetchTeachersWithSchoolNames = async () => {
      try {
        const schoolSnapshot = await getDocs(collection(firestore, "schools"))
        const schoolMap = {}
        schoolSnapshot.docs.forEach((doc) => {
          const schoolData = doc.data()
          schoolMap[doc.id] =
            schoolData.name || schoolData.schoolName || "Unknown"
        })

        const teacherSnapshot = await getDocs(collection(firestore, "teachers"))
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

    fetchTeachersWithSchoolNames()
  }, [])

  const filteredTeachers = teachers.filter((teacher) => {
    const name = teacher.name?.toLowerCase() || ""
    const email = teacher.email?.toLowerCase() || ""
    const school = teacher.schoolName?.toLowerCase() || ""
    return (
      name.includes(searchTeacherTerm) ||
      email.includes(searchTeacherTerm) ||
      school.includes(searchTeacherTerm)
    )
  })

  // All Students
  const [students, setStudents] = useState([])
  const [searchStudentTerm, setSearchStudentTerm] = useState("")

  useEffect(() => {
    const fetchStudentsWithSchoolNames = async () => {
      try {
        const schoolSnapshot = await getDocs(collection(firestore, "schools"))
        const schoolMap = {}
        schoolSnapshot.docs.forEach((doc) => {
          const schoolData = doc.data()
          schoolMap[doc.id] =
            schoolData.name || schoolData.schoolName || "Unknown"
        })

        const studentSnapshot = await getDocs(collection(firestore, "students"))
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

    fetchStudentsWithSchoolNames()
  }, [])

  const filteredStudents = students.filter((student) => {
    const name = student.studentName?.toLowerCase() || ""
    const email = student.email?.toLowerCase() || ""
    const school = student.schoolName?.toLowerCase() || ""
    return (
      name.includes(searchStudentTerm) ||
      email.includes(searchStudentTerm) ||
      school.includes(searchStudentTerm)
    )
  })

  return (
    <AppContext.Provider
      value={{
        setIsOpen,
        isOpen,

        // All Schhols
        setSearch,
        search,
        filteredSchools,
        schools,

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
        students
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppStore
