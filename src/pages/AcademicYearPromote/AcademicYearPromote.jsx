/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  collection,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore"
import { firestore } from "../../firebase/firebaseConfig"
import styles from "./AcademicYearPromote.module.css"
import Sidebar from "../../components/Sidebar"
import { AppContext } from "../../context/AppContext"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"
import Button from "@mui/material/Button"
import { useMediaQuery, useTheme } from "@mui/material"

const AcademicYearPromote = () => {
  const { isOpen, adminDetails } = useContext(AppContext)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [openConfirm, setOpenConfirm] = useState(false)
  const [stats, setStats] = useState({ totalStudents: 0, toBePromoted: 0 })
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const loadStudentStats = async () => {
    try {
      setLoading(true)
      const studentsRef =
        adminDetails.adminType !== "school-admin"
          ? collection(firestore, "students")
          : query(
              collection(firestore, "students"),
              where("schoolId", "==", adminDetails.schoolId)
            )

      const studentsSnapshot = await getDocs(studentsRef)

      let total = 0
      let promotable = 0

      studentsSnapshot.forEach((doc) => {
        const studentData = doc.data()
        const currentClass = parseInt(studentData.classId)
        total++

        if (!isNaN(currentClass)) {
          if (currentClass < 10) {
            promotable++
          }
        }
      })

      setStats({
        totalStudents: total,
        toBePromoted: promotable,
      })
    } catch (err) {
      console.error("Error loading student stats:", err)
      setError("Failed to load student data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudentStats()
  }, [adminDetails])

  const handlePromoteStudents = async () => {
    try {
      setOpenConfirm(false)
      setLoading(true)
      setError("")
      setSuccess("")

      await runTransaction(firestore, async (transaction) => {
        const studentsRef = collection(firestore, "students")
        const studentsSnapshot = await getDocs(studentsRef)

        studentsSnapshot.forEach((doc) => {
          const studentData = doc.data()
          const currentClass = parseInt(studentData.classId)

          if (!isNaN(currentClass) && currentClass < 10) {
            transaction.update(doc.ref, {
              classId: (currentClass + 1).toString(),
              promotedOn: new Date(),
            })
          }
        })
      })

      setSuccess(
        `${stats.toBePromoted} students have been promoted successfully!`
      )
      loadStudentStats()
    } catch (err) {
      console.error("Promotion error:", err)
      setError("Failed to promote students. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
            <h1>Academic Year Class Promotion</h1>
          </div>

          <div className={styles.card}>
            <h2>Class Promotion</h2>
            <p>
              Students will be advanced to the next class (e.g., Class 1 → Class
              2). Final-year students will not be promoted.
            </p>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <div className={`${styles.stats} ${isMobile ? styles.mobileStats : ''}`}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>
                  Total Enrolled Students:
                </span>
                <span className={styles.statValue}>{stats.totalStudents}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>
                  Eligible for Promotion:
                </span>
                <span className={styles.statValue}>{stats.toBePromoted}</span>
              </div>
            </div>

            <div className={`${styles.actions} ${isMobile ? styles.mobileActions : ''}`}>
              <Button
                variant="contained"
                disabled={loading}
                className={styles.primaryButton}
                onClick={() => setOpenConfirm(true)}
                fullWidth={isMobile}
              >
                {loading ? "Processing..." : "Initiate Promotion"}
              </Button>
              <Button
                onClick={() => navigate("/students")}
                className={styles.secondaryButton}
                fullWidth={isMobile}
              >
                View Student Records
              </Button>
            </div>

            <div className={styles.note}>
              <strong>Note:</strong> This operation is irreversible. Please
              ensure all student data is reviewed and appropriately backed up
              before continuing.
            </div>
          </div>
        </main>
      </div>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullScreen={isMobile}
      >
        <DialogTitle id="alert-dialog-title">Confirm Promotion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You are about to promote <strong>{stats.toBePromoted}</strong>{" "}
            students to the next academic level.
            <br />
            <br />
            <strong>This action is permanent and cannot be reversed.</strong>
            <br />
            Please confirm that you wish to proceed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenConfirm(false)}
            style={{
              background: "#f5f5f5",
              color: "#333",
              border: "1px solid #E5E5E5",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromoteStudents}
            autoFocus
            style={{ backgroundColor: "#4B0082", color: "white" }}
          >
            Confirm Promotion
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default AcademicYearPromote