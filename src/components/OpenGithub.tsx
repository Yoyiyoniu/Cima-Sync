import { openUrl } from "@tauri-apps/plugin-opener";
import GithubIcon from "../assets/icons/GithubIcon";

export const OpenGithub = () => {
    return (
        <div className="fixed bottom-4 right-4">
            <button
                title="Abrir proyecto de github"
                onClick={async () => {
                    await openUrl('https://github.com/Yoyiyoniu/uabc-captive-portal-bypass');
                }}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors duration-200">
                <GithubIcon width={30} height={30} />
            </button>
        </div>
    )
}
