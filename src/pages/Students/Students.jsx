import { Link } from "react-router-dom"
import { Plus, Search, User } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/Schools.module.css"
import { useContext } from "react"
import { AppContext } from "../../context/AppContext"

const Students = () => {
  const { filteredStudents, searchStudentTerm, setSearchStudentTerm, isOpen } =
    useContext(AppContext)

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div
        className={`${styles.mainContent} ${
          isOpen ? styles.blurredContent : ""
        }`}
      >
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
              <table className={styles.desktopTable}>
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
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7">No students found.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className={styles.schoolInfo}>
                            <div className={styles.schoolIcon}>
                              <User size={18} />
                            </div>
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
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileCards}>
              {filteredStudents.length === 0 ? (
                <div className={styles.noResults}>No students found.</div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} className={styles.schoolCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.schoolInfo}>
                        <div className={styles.schoolIcon}>
                          <User size={18} />
                        </div>
                        <div>
                          <h3>{student.studentName || "-"}</h3>
                          <p className={styles.principal}>
                            <span>Roll No: </span>
                            <span>{student.admissionNumber || "-"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.detailRow}>
                        <span>School:</span>
                        <span>{student.schoolName || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Class:</span>
                        <span>{student.classId || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Section:</span>
                        <span>{student.sectionId || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Email:</span>
                        <span>{student.email || "-"}</span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button className={styles.editButton}>Edit</button>
                      <button className={styles.deleteButton}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Students
