# crm_summary.py
import streamlit as st
import pandas as pd
import numpy as np
import io, os, datetime, time

from google.oauth2 import service_account
from googleapiclient.discovery import build

# ===========================
# ==== GENEL AYARLAR
# ===========================
st.set_page_config(page_title="ŞEKEROĞLU CRM Özet", layout="wide")

LOCAL_FILE = "temp.xlsx"
SHEET_ID = "1IF6CN4oHEMk6IEE40ZGixPkfnNHLYXnQ"
MUSTERI_SHEET_NAME = "Sayfa1"
PROFORMA_SHEET_NAME = "Proformalar"

# ===========================
# ==== LOGIN
# ===========================
USERS = {"Boss": "Seker12345!"}
if "user" not in st.session_state:
    st.session_state.user = None

def login_screen():
    st.title("ŞEKEROĞLU CRM - Özet Ekran Giriş")
    u = st.text_input("Kullanıcı Adı")
    p = st.text_input("Şifre", type="password")
    if st.button("Giriş Yap"):
        if u in USERS and p == USERS[u]:
            st.session_state.user = u
            st.success("Giriş başarılı!")
            st.rerun()
        else:
            st.error("Kullanıcı adı veya şifre hatalı.")

if not st.session_state.user:
    login_screen()
    st.stop()

# ===========================
# ==== GOOGLE SHEETS SERVİS
# ===========================
@st.cache_resource
def build_sheets():
    creds = service_account.Credentials.from_service_account_info(
        st.secrets["gcp_service_account"],
        scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)

sheets_svc = build_sheets()

def read_gsheet(sheet_name: str) -> pd.DataFrame:
    try:
        result = sheets_svc.spreadsheets().values().get(
            spreadsheetId=SHEET_ID,
            range=f"{sheet_name}!A1:ZZ"
        ).execute()
        values = result.get("values", [])
        if not values:
            return pd.DataFrame()
        header, rows = values[0], values[1:]
        return pd.DataFrame(rows, columns=header)
    except Exception as e:
        st.warning(f"Google Sheets okuma hatası: {e}")
        return pd.DataFrame()

# ===========================
# ==== VERİ YÜKLEME & SENKRON
# ===========================
def load_local():
    if not os.path.exists(LOCAL_FILE):
        return None, None
    try:
        df_m = pd.read_excel(LOCAL_FILE, sheet_name="Sayfa1")
    except: df_m = pd.DataFrame()
    try:
        df_p = pd.read_excel(LOCAL_FILE, sheet_name="Proformalar")
    except: df_p = pd.DataFrame()
    return df_m, df_p

def save_local(df_musteri, df_proforma):
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as w:
        df_musteri.to_excel(w, sheet_name="Sayfa1", index=False)
        df_proforma.to_excel(w, sheet_name="Proformalar", index=False)
    buffer.seek(0)
    with open(LOCAL_FILE, "wb") as f:
        f.write(buffer.read())

def sync_data():
    df_local_m, df_local_p = load_local()
    df_sheet_m = read_gsheet("Sayfa1")
    df_sheet_p = read_gsheet("Proformalar")

    # Basit strateji: hangisi büyükse onu al
    if df_local_m is None or df_local_m.empty:
        save_local(df_sheet_m, df_sheet_p)
        return df_sheet_m, df_sheet_p
    if len(df_sheet_m) >= len(df_local_m):
        save_local(df_sheet_m, df_sheet_p)
        return df_sheet_m, df_sheet_p
    else:
        return df_local_m, df_local_p

df_musteri, df_proforma = sync_data()

# ===========================
# ==== ÖZET EKRAN
# ===========================
st.title("📊 CRM Özet Ekran")

# --- Bekleyen Proformalar
st.subheader("📝 Bekleyen Proformalar")
bekleyen = df_proforma[df_proforma.get("Durum", "") == "Beklemede"].copy()
if bekleyen.empty:
    st.info("Bekleyen proforma yok.")
else:
    bekleyen["Tarih"] = pd.to_datetime(bekleyen["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y").fillna("")
    st.dataframe(bekleyen[["Müşteri Adı","Proforma No","Tarih","Tutar","Vade (gün)"]], use_container_width=True)

# --- Yolda Olanlar
st.subheader("🛳️ ETA Takibi (Yolda)")
yolda = df_proforma[df_proforma.get("Sevk Durumu", "") == "Sevkedildi"].copy()
if yolda.empty:
    st.info("Yolda olan sipariş yok.")
else:
    yolda["Tarih"] = pd.to_datetime(yolda["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y").fillna("")
    st.dataframe(yolda[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar"]], use_container_width=True)

# --- Teslim Edilenler
st.subheader("✅ Son Teslim Edilenler")
teslim = df_proforma[df_proforma.get("Sevk Durumu", "") == "Ulaşıldı"].copy()
if teslim.empty:
    st.info("Teslim edilmiş sipariş yok.")
else:
    teslim["Tarih"] = pd.to_datetime(teslim["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y").fillna("")
    st.dataframe(teslim[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar"]].sort_values(by="Tarih", ascending=False).head(5), use_container_width=True)
