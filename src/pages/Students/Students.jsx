import { Link } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/Schools.module.css"
import { useContext } from "react"
import { AppContext } from "../../context/AppContext"

const Students = () => {
  const { filteredStudents, searchStudentTerm, setSearchStudentTerm } = useContext(AppContext)

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Students</h1>
            <Link to="/students/add" className={styles.addButton}>
              <Plus size={18} />
              <span>Add Student</span>
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} size={18} />
                <input
                  type="text"
                  placeholder="Search students | mail | school"
                  value={searchStudentTerm}
                  onChange={(e) => setSearchStudentTerm(e.target.value)}
                />
              </div>
              <div className={styles.actionButtons}>
                <button>Filter</button>
                <button>Export</button>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>School</th>
                    <th>Roll Number</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className={styles.schoolInfo}>
                            <div>{student.studentName || "-"}</div>
                          </div>
                        </td>
                        <td>{student.schoolName || "-"}</td>
                        <td>{student.admissionNumber || "-"}</td>
                        <td>{student.classId || "-"}</td>
                        <td>{student.sectionId || "-"}</td>
                        <td>{student.email || "-"}</td>
                        <td>
                          <button className={styles.editButton}>Edit</button>
                          <button className={styles.deleteButton}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className={styles.noDataRow}>
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Students
