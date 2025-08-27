# dashboard.py
import streamlit as st
import pandas as pd
import io, datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# ===========================
# ==== GENEL AYARLAR
# ===========================
st.set_page_config(page_title="ŞEKEROĞLU ÖZET DASHBOARD", layout="wide")

# Drive’daki Excel dosyası (CRM ile kullandığın dosya)
EXCEL_FILE_ID = "1IF6CN4oHEMk6IEE40ZGixPkfnNHLYXnQ"

# ===========================
# ==== KULLANICI GİRİŞİ
# ===========================
USERS = {"Boss": "Seker12345!"}
if "user" not in st.session_state:
    st.session_state.user = None

def login_screen():
    st.title("ŞEKEROĞLU - Özet Dashboard")
    u = st.text_input("Kullanıcı Adı")
    p = st.text_input("Şifre", type="password")
    if st.button("Giriş Yap"):
        if u in USERS and p == USERS[u]:
            st.session_state.user = u
            st.rerun()
        else:
            st.error("Kullanıcı adı veya şifre hatalı.")

if not st.session_state.user:
    login_screen()
    st.stop()

# ===========================
# ==== GOOGLE DRIVE API
# ===========================
@st.cache_resource
def build_drive():
    creds = service_account.Credentials.from_service_account_info(
        st.secrets["gcp_service_account"],
        scopes=["https://www.googleapis.com/auth/drive"]
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)

drive_svc = build_drive()

def download_excel_file(file_id, local_path="temp.xlsx"):
    request = drive_svc.files().get_media(fileId=file_id)
    fh = io.FileIO(local_path, "wb")
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        status, done = downloader.next_chunk()
    return local_path

# ===========================
# ==== VERİLERİ YÜKLE
# ===========================
excel_path = download_excel_file(EXCEL_FILE_ID)

try:
    df_proforma = pd.read_excel(excel_path, sheet_name="Proformalar")
except Exception:
    df_proforma = pd.DataFrame()

try:
    df_evrak = pd.read_excel(excel_path, sheet_name="Evraklar")
except Exception:
    df_evrak = pd.DataFrame()

# ===========================
# ==== ÖZET DASHBOARD
# ===========================
st.title("📊 ŞEKEROĞLU İHRACAT - ÖZET PANEL")

# === Bekleyen Proformalar ===
st.markdown("### 📝 Bekleyen Proformalar")
bekleyen = df_proforma[df_proforma.get("Durum", "") == "Beklemede"].copy()
if not bekleyen.empty:
    bekleyen["Tarih"] = pd.to_datetime(bekleyen["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y")
    toplam = pd.to_numeric(bekleyen["Tutar"], errors="coerce").sum()
    st.markdown(f"**Toplam Bekleyen Tutar:** {toplam:,.2f} $")
    st.dataframe(bekleyen[["Müşteri Adı", "Ülke", "Proforma No", "Tarih", "Tutar", "Vade (gün)", "Açıklama"]], use_container_width=True)
else:
    st.info("Bekleyen proforma yok.")

# === Vade Takibi ===
st.markdown("### 💰 Vade Takibi")
if not df_evrak.empty and "Vade Tarihi" in df_evrak.columns:
    bugun = datetime.date.today()
    df_evrak["Vade Tarihi"] = pd.to_datetime(df_evrak["Vade Tarihi"], errors="coerce")
    vade = df_evrak[
        (df_evrak["Ödendi"] != True) &
        (df_evrak["Vade Tarihi"].notna())
    ].copy()
    vade["Vade Günü"] = vade["Vade Tarihi"].dt.strftime("%d/%m/%Y")
    gecmis = vade[vade["Vade Tarihi"].dt.date < bugun]
    gelecek = vade[vade["Vade Tarihi"].dt.date >= bugun]

    st.subheader("⏳ Geciken Ödemeler")
    if not gecmis.empty:
        st.dataframe(gecmis[["Müşteri Adı","Proforma No","Fatura No","Vade Günü","Tutar"]], use_container_width=True)
    else:
        st.success("Geciken ödeme yok.")

    st.subheader("📅 Yaklaşan Vadeler")
    if not gelecek.empty:
        st.dataframe(gelecek[["Müşteri Adı","Proforma No","Fatura No","Vade Günü","Tutar"]], use_container_width=True)
    else:
        st.info("Yaklaşan vade yok.")
else:
    st.warning("Evraklar sheetinde 'Vade Tarihi' bulunamadı.")

# === ETA Takibi ===
st.markdown("### 🛳️ ETA Takibi")
if "Sevk Durumu" in df_proforma.columns:
    eta_yolda = df_proforma[df_proforma["Sevk Durumu"] == "Sevkedildi"].copy()
    if not eta_yolda.empty:
        toplam_eta = pd.to_numeric(eta_yolda["Tutar"], errors="coerce").sum()
        st.markdown(f"**Yoldaki Toplam Tutar:** {toplam_eta:,.2f} $")
        st.dataframe(eta_yolda[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar","Açıklama"]], use_container_width=True)
    else:
        st.info("Yolda olan sipariş yok.")

# === Teslim Edilenler ===
st.markdown("### ✅ Son Teslim Edilenler")
if "Sevk Durumu" in df_proforma.columns:
    teslim = df_proforma[df_proforma["Sevk Durumu"] == "Ulaşıldı"].copy()
    if not teslim.empty:
        teslim = teslim.sort_values(by="Tarih", ascending=False).head(5)
        st.dataframe(teslim[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar","Açıklama"]], use_container_width=True)
    else:
        st.info("Teslim edilmiş sipariş yok.")
