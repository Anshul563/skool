import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Styles (same as before)
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 12, lineHeight: 1.5 },
  header: { marginBottom: 20, textAlign: "center", borderBottom: "1px solid #eee", paddingBottom: 10 },
  schoolName: { fontSize: 24, fontWeight: "bold", textTransform: "uppercase", paddingBottom: 10 },
  schoolAddress: { fontSize: 10, color: "gray" },
  title: { fontSize: 16, fontWeight: "bold", marginVertical: 15, textAlign: "center", textDecoration: "underline", textTransform: "uppercase" },
  infoContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  infoColumn: { flexDirection: "column" },
  label: { fontSize: 10, color: "gray" },
  value: { fontSize: 12, fontWeight: "bold" },
  table: { display: "flex", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 20 },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableHeader: { backgroundColor: "#f3f4f6", fontWeight: "bold" },
  tableCol1: { width: "70%", borderRightWidth: 1, borderRightColor: "#e5e7eb", padding: 8 },
  tableCol2: { width: "30%", padding: 8, textAlign: "right" },
  totalRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#000", marginTop: 5, paddingTop: 5 },
  totalLabel: { width: "70%", textAlign: "right", paddingRight: 10, fontWeight: "bold" },
  totalValue: { width: "30%", textAlign: "right", fontWeight: "bold" },
  footer: { marginTop: 50, textAlign: "center", fontSize: 10, color: "gray", borderTop: "1px solid #eee", paddingTop: 10 },
  paymentMeta: { marginTop: 10, fontSize: 10, color: "#555" }
});

// ✅ Updated Interface
interface FeeReceiptProps {
  receiptNo: string;
  date: string;
  studentName: string;
  classDetails: string;
  admissionNo?: string;
  description: string;
  amount: number;
  paymentMode: string;
  transactionId?: string;
  // New Prop for Dynamic School Data
  schoolSettings: {
    schoolName: string;
    schoolAddress: string;
    schoolPhone?: string | null;
    schoolEmail?: string | null;
  };
}

export const FeeReceiptPdf = ({ 
  receiptNo, 
  date, 
  studentName, 
  classDetails, 
  admissionNo, 
  description, 
  amount, 
  paymentMode, 
  transactionId,
  schoolSettings // ✅ Receive here
}: FeeReceiptProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header with Dynamic Data */}
      <View style={styles.header}>
        <Text style={styles.schoolName}>{schoolSettings.schoolName}</Text>
        <Text style={styles.schoolAddress}>{schoolSettings.schoolAddress}</Text>
        <Text style={styles.schoolAddress}>
          Phone: {schoolSettings.schoolPhone || "N/A"} | Email: {schoolSettings.schoolEmail || "N/A"}
        </Text>
      </View>

      <Text style={styles.title}>FEE PAYMENT RECEIPT</Text>

      {/* Student & Receipt Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoColumn}>
          <Text style={styles.label}>Receipt No:</Text>
          <Text style={styles.value}>{receiptNo}</Text>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{date}</Text>
        </View>
        <View style={styles.infoColumn}>
          <Text style={styles.label}>Student Name:</Text>
          <Text style={styles.value}>{studentName}</Text>
          <Text style={styles.label}>Class:</Text>
          <Text style={styles.value}>{classDetails}</Text>
          {admissionNo && <Text style={styles.label}>Adm No: {admissionNo}</Text>}
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableCol1}><Text>Description</Text></View>
          <View style={styles.tableCol2}><Text>Amount (INR)</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol1}><Text>{description}</Text></View>
          <View style={styles.tableCol2}><Text>{(amount / 100).toFixed(2)}</Text></View>
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Grand Total:</Text>
        <Text style={styles.totalValue}>INR {(amount / 100).toFixed(2)}</Text>
      </View>

      {/* Payment Details */}
      <View style={{ marginTop: 20 }}>
        <Text style={styles.paymentMeta}>Payment Mode: {paymentMode}</Text>
        {transactionId && <Text style={styles.paymentMeta}>Transaction ID: {transactionId}</Text>}
        <Text style={styles.paymentMeta}>Status: PAID</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>This is a computer-generated receipt from {schoolSettings.schoolName}.</Text>
        <Text>Thank you for the payment.</Text>
      </View>

    </Page>
  </Document>
);