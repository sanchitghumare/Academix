"use server"

import connectDb from "@/db/connectDb"
import User from "@/models/user"


export const fetchuser = async (username) => {
    await connectDb()
    let u = await User.findOne({ username: username }).lean()
    if (!u) return null;
    if (u.notifications?.fcmToken) {
        delete u.notifications.fcmToken;
    }

    return JSON.parse(JSON.stringify(u))
}

export const updateProfile = async (data, oldusername) => {
    await connectDb()
    let ndata = Object.fromEntries(data)

    // If the username is being updated, check if username is available
    if (oldusername !== ndata.username) {
        let u = await User.findOne({ username: ndata.username })
        if (u) {
            return { error: "Username already exists" }
        }
        await User.updateOne({ email: ndata.email }, ndata)
    }
    else {
        await User.updateOne({ email: ndata.email }, ndata)
    }
}