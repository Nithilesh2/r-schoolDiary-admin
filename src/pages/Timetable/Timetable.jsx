/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useState, useEffect } from "react"
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  addDoc,
} from "firebase/firestore"
import { firestore } from "../../firebase/firebaseConfig"
import styles from "./Timetable.module.css"
import Sidebar from "../../components/Sidebar"
import { AppContext } from "../../context/AppContext"

const Timetable = () => {
  const { isOpen, adminDetails, success, failure } = useContext(AppContext)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [timetable, setTimetable] = useState([])
  const [days] = useState([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ])
  const [periods] = useState(
    Array.from({ length: 8 }, (_, i) => `Period ${i + 1}`)
  )
  const [openDialog, setOpenDialog] = useState(false)
  const [currentSlot, setCurrentSlot] = useState({ day: "", period: "" })
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [teacherOptions, setTeacherOptions] = useState([])
  const [selectedTimetableDocId, setSelectedTimetableDocId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const teachersQuery = query(
          collection(firestore, "teachers"),
          where("schoolId", "==", adminDetails.schoolId)
        )
        const teachersSnapshot = await getDocs(teachersQuery)

        const teachersData = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          assignments: doc.data().assignments || [],
        }))

        setTeachers(teachersData)

        const classSectionMap = new Map()
        teachersData.forEach((teacher) => {
          teacher.assignments.forEach((assignment) => {
            if (assignment.class && assignment.section) {
              if (!classSectionMap.has(assignment.class)) {
                classSectionMap.set(assignment.class, new Set())
              }
              classSectionMap.get(assignment.class).add(assignment.section)
            }
          })
        })

        const classesArray = Array.from(classSectionMap.keys()).sort()
        setClasses(classesArray)
      } catch (err) {
        console.error("Error fetching data:", err)
        failure("Failed to load timetable data")
      } finally {
        setLoading(false)
      }
    }

    if (adminDetails?.schoolId) {
      fetchData()
    }
  }, [adminDetails])

  useEffect(() => {
    if (selectedClass) {
      const sectionsSet = new Set()
      teachers.forEach((teacher) => {
        teacher.assignments.forEach((assignment) => {
          if (assignment.class === selectedClass) {
            sectionsSet.add(assignment.section)
          }
        })
      })
      setSections(Array.from(sectionsSet).sort())
      setSelectedSection("")
    }
  }, [selectedClass, teachers])

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!selectedClass || !selectedSection) return

      try {
        setLoading(true)
        const timetableQuery = query(
          collection(firestore, "timetables"),
          where("class", "==", selectedClass),
          where("section", "==", selectedSection),
          where("schoolId", "==", adminDetails.schoolId)
        )
        const timetableSnapshot = await getDocs(timetableQuery)

        if (!timetableSnapshot.empty) {
          const docData = timetableSnapshot.docs[0].data()
          const existingSlots = docData.slots || []
          const allSlots = days.flatMap((day) =>
            periods.map((period) => {
              const existingSlot = existingSlots.find(
                (s) => s.day === day && s.period === period
              )
              return existingSlot || { day, period, teacher: "", subject: "" }
            })
          )
          setTimetable(allSlots)
          setSelectedTimetableDocId(timetableSnapshot.docs[0].id)
        } else {
          const emptyTimetable = days.flatMap((day) =>
            periods.map((period) => ({
              day,
              period,
              teacher: "",
              subject: "",
            }))
          )
          setTimetable(emptyTimetable)
          setSelectedTimetableDocId(null)
        }
      } catch (err) {
        console.error("Error fetching timetable:", err)
        failure("Failed to load timetable")
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [selectedClass, selectedSection])

  useEffect(() => {
    if (selectedClass && selectedSection) {
      const options = []

      teachers.forEach((teacher) => {
        const relevantAssignments = teacher.assignments.filter(
          (assignment) =>
            assignment.class === selectedClass &&
            assignment.section === selectedSection
        )

        relevantAssignments.forEach((assignment) => {
          options.push({
            teacherId: teacher.id,
            teacherName: teacher.name,
            subject: assignment.subject,
            label: `${teacher.name} (${assignment.subject})`,
            value: `${teacher.id}_${assignment.subject}`,
          })
        })
      })

      setTeacherOptions(options)
    } else {
      setTeacherOptions([])
    }
  }, [selectedClass, selectedSection, teachers])

  const handleSlotClick = (day, period) => {
    const slot = timetable.find((s) => s.day === day && s.period === period)
    setCurrentSlot({ day, period })
    setSelectedTeacher(slot ? `${slot.teacher}_${slot.subject}` : "")
    setOpenDialog(true)
  }

  const handleSaveSlot = async () => {
    try {
      setLoading(true)

      const [teacherId, subject] = selectedTeacher.split("_")

      const updatedTimetable = timetable.map((slot) =>
        slot.day === currentSlot.day && slot.period === currentSlot.period
          ? {
              ...slot,
              teacher: teacherId,
              subject: subject,
            }
          : slot
      )

      setTimetable(updatedTimetable)

      const timetableData = {
        schoolId: adminDetails.schoolId,
        class: selectedClass,
        section: selectedSection,
        slots: updatedTimetable,
        lastUpdated: new Date(),
      }

      if (selectedTimetableDocId) {
        const timetableRef = doc(
          firestore,
          "timetables",
          selectedTimetableDocId
        )
        await setDoc(timetableRef, timetableData, { merge: true })
      } else {
        const timetableCollection = collection(firestore, "timetables")
        const newDoc = await addDoc(timetableCollection, timetableData)
        setSelectedTimetableDocId(newDoc.id)
      }

      success("Timetable saved successfully!")
      setOpenDialog(false)
    } catch (err) {
      console.error("Error saving timetable:", err)
      failure("Failed to save timetable")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSlot = async () => {
    try {
      setLoading(true)
      const updatedTimetable = timetable.map((slot) =>
        slot.day === currentSlot.day && slot.period === currentSlot.period
          ? { ...slot, teacher: "", subject: "" }
          : slot
      )
      setTimetable(updatedTimetable)

      if (selectedTimetableDocId) {
        const timetableRef = doc(
          firestore,
          "timetables",
          selectedTimetableDocId
        )
        await setDoc(
          timetableRef,
          {
            slots: updatedTimetable,
            lastUpdated: new Date(),
          },
          { merge: true }
        )
        success("Slot cleared successfully!")
        setOpenDialog(false)
      } else {
        failure("No timetable exists to clear the slot")
      }
    } catch (err) {
      console.error("Error deleting slot:", err)
      failure("Failed to clear slot")
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
        {loading ? (
          <main className={styles.content}>
            <div className={styles.header}>
              <div
                className={`${styles.skeleton} ${styles.skeletonText}`}
                style={{ width: "300px", height: "36px", marginBottom: "12px" }}
              ></div>
              <div
                className={`${styles.skeleton} ${styles.skeletonText}`}
                style={{ width: "250px", height: "20px" }}
              ></div>
            </div>

            <div className={styles.controls}>
              <div className={styles.row}>
                <div className={styles.column}>
                  <div
                    className={`${styles.skeleton} ${styles.skeletonText}`}
                    style={{
                      width: "50px",
                      height: "20px",
                      marginBottom: "8px",
                    }}
                  ></div>
                  <div
                    className={`${styles.skeleton} ${styles.skeletonInput}`}
                    style={{ height: "40px" }}
                  ></div>
                </div>
                <div className={styles.column}>
                  <div
                    className={`${styles.skeleton} ${styles.skeletonText}`}
                    style={{
                      width: "60px",
                      height: "20px",
                      marginBottom: "8px",
                    }}
                  ></div>
                  <div
                    className={`${styles.skeleton} ${styles.skeletonInput}`}
                    style={{ height: "40px" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className={styles.timetableContainer}>
              <div
                className={`${styles.skeleton} ${styles.skeletonTable}`}
                style={{ height: "500px" }}
              ></div>
            </div>
          </main>
        ) : (
          <main className={styles.content}>
            <div className={styles.header}>
              <h2>School Timetable Management</h2>
              <p>Create and manage class timetables</p>
            </div>

            <div className={styles.controls}>
              <div className={styles.row}>
                <div className={styles.column}>
                  <label>Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="" disabled>
                      Select Class
                    </option>
                    {classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.column}>
                  <label>Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    disabled={!selectedClass}
                  >
                    <option value="" disabled>
                      Select Section
                    </option>
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedClass && selectedSection && (
              <div className={styles.timetableContainer}>
                <table>
                  <thead>
                    <tr>
                      <th>Day/Period</th>
                      {periods.map((period) => (
                        <th key={period}>{period}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => (
                      <tr key={day}>
                        <td>{day}</td>
                        {periods.map((period) => {
                          const slot = timetable.find(
                            (s) => s.day === day && s.period === period
                          )
                          const teacher = teachers.find(
                            (t) => t.id === slot?.teacher
                          )
                          return (
                            <td
                              key={`${day}_${period}`}
                              onClick={() => handleSlotClick(day, period)}
                              className={styles.timetableCell}
                            >
                              {teacher && slot?.subject ? (
                                <div>
                                  <div>{teacher.name}</div>
                                  <small style={{ color: "#666" }}>
                                    {slot.subject}
                                  </small>
                                </div>
                              ) : (
                                <span
                                  style={{ fontSize: "1.2em", color: "#888" }}
                                >
                                  +
                                </span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {openDialog && (
              <div className={styles.dialogOverlay}>
                <div className={styles.dialog}>
                  <div className={styles.dialogTitle}>
                    Edit Timetable Slot - {currentSlot.day},{" "}
                    {currentSlot.period}
                  </div>
                  <div className={styles.dialogContent}>
                    <label>Select Teacher and Subject</label>
                    <select
                      value={selectedTeacher}
                      onChange={(e) => setSelectedTeacher(e.target.value)}
                    >
                      <option value="">Select</option>
                      {teacherOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.dialogActions}>
                    <button
                      onClick={handleDeleteSlot}
                      className={styles.danger}
                    >
                      🗑️ Clear
                    </button>
                    <button onClick={() => setOpenDialog(false)}>Cancel</button>
                    <button
                      onClick={handleSaveSlot}
                      disabled={!selectedTeacher}
                      className={styles.primary}
                    >
                      💾 Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  )
}

export default Timetable
