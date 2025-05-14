import { collection, addDoc, Timestamp } from "firebase/firestore"
import { firestore as db } from "../firebase/firebaseConfig"

export const logActivity = async (action, user = "System") => {
  try {
    await addDoc(collection(db, "activities"), {
      action,
      user,
      time: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}
