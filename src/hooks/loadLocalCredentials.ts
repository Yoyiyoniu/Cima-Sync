import { useEffect, useState } from "react";
import { getCredentials } from "../controller/DbController";

export const loadLocalCredentials = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberSession, setRememberSession] = useState(false);

    useEffect(() => {
        async function loadCredentials() {
            try {
                const result = await getCredentials();
                if (result) {
                    const { email, password } = result;
                    setEmail(email);
                    setPassword(password);
                    setRememberSession(true);
                }
            } catch (error) {
                console.error("Error loading credentials:", error);
            }
        }
        loadCredentials();
    }, [])
    return { email, password, rememberSession }
}