import { useState, useCallback } from "react";
import { Modal } from "./Modal"
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";

export const CopyRightMenu = () => {
  const [showModal, setShowModal] = useState(false);

  const { t } = useTranslation();

  const handleOpenUrl = useCallback(async () => {
    await openUrl("https://www.honeyfix.solutions");
  }, []);

  return (
      <span>
          <Modal 
            title={t("Modal.thanks")}
            modalText={t("Modal.thanksDescription")}
            showModal={showModal}
            setShowModal={setShowModal}
            handleModalFunction={handleOpenUrl}
          />
          <button type="button" className="text-white/80 hover:text-white" onClick={() => setShowModal(true)}>
            <p>Created by Honeyfix</p>
          </button>
    </span>
  )
}
