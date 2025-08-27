# dashboard.py
import streamlit as st
import pandas as pd
import io, datetime, os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# ===========================
# ==== GENEL AYARLAR
# ===========================
st.set_page_config(page_title="ŞEKEROĞLU ÖZET DASHBOARD", layout="wide")

EXCEL_FILE_ID = "1IF6CN4oHEMk6IEE40ZGixPkfnNHLYXnQ"   # Drive Excel ID
LOCAL_FILE = "D:/APP/temp.xlsx"

# ===========================
# ==== LOGIN
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
    try:
        request = drive_svc.files().get_media(fileId=file_id)
        fh = io.FileIO(local_path, "wb")
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        return local_path
    except Exception as e:
        st.warning(f"Drive’dan indirilemedi, local dosya kullanılacak. ({e})")
        return None

# ===========================
# ==== VERİLERİ YÜKLE
# ===========================
excel_path = download_excel_file(EXCEL_FILE_ID, "temp.xlsx")
if excel_path is None or not os.path.exists("temp.xlsx"):
    excel_path = LOCAL_FILE
    st.info(f"Local dosya kullanılıyor: {excel_path}")

try:
    df_proforma = pd.read_excel(excel_path, sheet_name="Proformalar")
except Exception:
    df_proforma = pd.DataFrame()

try:
    df_evrak = pd.read_excel(excel_path, sheet_name="Evraklar")
except Exception:
    df_evrak = pd.DataFrame()

try:
    df_eta = pd.read_excel(excel_path, sheet_name="ETA")
except Exception:
    df_eta = pd.DataFrame()

# ===========================
# ==== ÖZET DASHBOARD
# ===========================
st.title("📊 ŞEKEROĞLU İHRACAT - ÖZET PANEL")

bugun = datetime.date.today()

# --- Bekleyen Proformalar ---
bekleyen = df_proforma[df_proforma.get("Durum", "") == "Beklemede"].copy()
toplam_bekleyen = pd.to_numeric(bekleyen.get("Tutar", []), errors="coerce").sum()

# --- Vade Takibi (Evraklar) ---
if not df_evrak.empty:
    df_evrak["Vade Tarihi"]   = pd.to_datetime(df_evrak.iloc[:,3], errors="coerce")  # D sütunu
    df_evrak["Tutar"]         = pd.to_numeric(df_evrak.iloc[:,4], errors="coerce")  # E sütunu
    df_evrak["Ödendi"]        = df_evrak.iloc[:,14]  # O sütunu
    vade = df_evrak[(df_evrak["Ödendi"] != True) & (df_evrak["Vade Tarihi"].notna())].copy()

    gecmis = vade[vade["Vade Tarihi"].dt.date < bugun]
    gelecek = vade[vade["Vade Tarihi"].dt.date >= bugun]

    toplam_geciken = gecmis["Tutar"].sum()
    toplam_gelecek = gelecek["Tutar"].sum()
else:
    toplam_geciken = toplam_gelecek = 0

# --- ETA Takibi ---
eta_sayi = len(df_eta) if not df_eta.empty else 0

# ===========================
# ==== ÖZET KUTULAR
# ===========================
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("📝 Bekleyen Proformalar", f"{toplam_bekleyen:,.2f} $")

with col2:
    st.metric("⏳ Geciken Vadeler", f"{toplam_geciken:,.2f} $")

with col3:
    st.metric("📅 Yaklaşan Vadeler", f"{toplam_gelecek:,.2f} $")

with col4:
    st.metric("🛳️ ETA Kayıtları", eta_sayi)

st.markdown("---")

# ===========================
# ==== DETAY TABLOLAR
# ===========================
# Bekleyen Proformalar
st.markdown("### 📝 Bekleyen Proformalar")
if not bekleyen.empty:
    bekleyen["Tarih"] = pd.to_datetime(bekleyen["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y")
    st.dataframe(bekleyen[["Müşteri Adı", "Ülke", "Proforma No", "Tarih", "Tutar", "Vade (gün)", "Açıklama"]],
                 use_container_width=True)
else:
    st.info("Bekleyen proforma yok.")

# Vade Takibi
st.markdown("### 💰 Vade Takibi")
if toplam_geciken > 0:
    st.subheader("⏳ Geciken Ödemeler")
    st.dataframe(gecmis[["Müşteri Adı","Proforma No","Fatura No","Vade Tarihi","Tutar"]],
                 use_container_width=True)

if toplam_gelecek > 0:
    st.subheader("📅 Yaklaşan Vadeler")
    st.dataframe(gelecek[["Müşteri Adı","Proforma No","Fatura No","Vade Tarihi","Tutar"]],
                 use_container_width=True)

# ETA
st.markdown("### 🛳️ ETA Takibi")
if not df_eta.empty:
    df_eta["ETA Tarihi"] = pd.to_datetime(df_eta.iloc[:,1], errors="coerce")  # B sütunu
    df_eta["ETA Günü"] = df_eta["ETA Tarihi"].dt.strftime("%d/%m/%Y")
    st.dataframe(df_eta[["Müşteri Adı","Proforma No","ETA Günü","Açıklama"]], use_container_width=True)
else:
    st.info("ETA sayfasında veri yok.")
