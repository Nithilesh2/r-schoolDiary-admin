import { useContext, useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { firestore } from "../../firebase/firebaseConfig"
import styles from "./AcademicYearCurrent.module.css"
import Sidebar from "../../components/Sidebar"
import { AppContext } from "../../context/AppContext"
import { CircularProgress } from "@mui/material"

const AcademicYearReports = () => {
  const { isOpen, adminDetails } = useContext(AppContext)
  const [academicReports, setAcademicReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const q = collection(firestore, "academicYearReports")
        const querySnapshot = await getDocs(q)

        const filteredReports = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          for (const year in data) {
            const report = data[year]
            if (report.schoolId === adminDetails.schoolId) {
              filteredReports.push({
                year,
                ...report,
              })
            }
          }
        })

        setAcademicReports(filteredReports)
      } catch (err) {
        console.error("Error fetching academic reports:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [adminDetails.schoolId])

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div
        className={`${styles.mainContent} ${
          isOpen ? styles.blurredContent : ""
        }`}
      >
        <main className={styles.content}>
          <div className={styles.header}>
            <h1>Academic Year Summary</h1>
            <p>View annual stats for your school</p>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "40px",
              }}
            >
              <CircularProgress sx={{ color: "#4B0082" }} />
            </div>
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.desktopTable}>
                  <thead>
                    <tr>
                      <th>Academic Year</th>
                      <th>Total Students</th>
                      <th>Total Teachers</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicReports.map((report) => (
                      <tr key={report.year} className={styles.tableRow}>
                        <td className={styles.tableCell}>{report.year}</td>
                        <td className={styles.tableCell}>
                          {report.totalStudents || 0}
                        </td>
                        <td className={styles.tableCell}>
                          {report.totalTeachers || 0}
                        </td>
                        <td className={styles.tableCell}>
                          {report.updatedAt?.toDate?.().toLocaleString?.() ||
                            "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.mobileCards}>
                {academicReports.length === 0 ? (
                  <div className={styles.noResults}>No records found.</div>
                ) : (
                  academicReports.map((records) => (
                    <div key={records.year} className={styles.schoolCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.schoolInfo}>
                          <div>
                            <h3>{records.year || "-"}</h3>
                            <p className={styles.principal}>
                              <span>Total Students: </span>
                              <span>{records.totalStudents || 0}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.detailRow}>
                          <span>Total Teachers: </span>
                          <span>{records.totalTeachers || 0}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span>Last Updated: </span>
                          <span>
                            {records.updatedAt?.toDate?.().toLocaleString?.() ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default AcademicYearReports
