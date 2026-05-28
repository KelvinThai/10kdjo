import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  border: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#111111",
    padding: 30,
    alignItems: "center",
    justifyContent: "space-between",
  },
  innerBorder: {
    width: "100%",
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#999999",
    padding: 30,
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 9,
    letterSpacing: 4,
    color: "#999999",
    fontFamily: "Helvetica-Bold",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#444444",
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginTop: 14,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 24,
    fontSize: 11,
    color: "#555555",
    letterSpacing: 1,
  },
  name: {
    marginTop: 10,
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  divider: {
    marginTop: 14,
    height: 1,
    width: 220,
    backgroundColor: "#222222",
  },
  bodyLine: {
    marginTop: 18,
    fontSize: 11,
    color: "#555555",
  },
  courseTitle: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
  footerColLeft: { alignItems: "flex-start" },
  footerColRight: { alignItems: "flex-end" },
  footerLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: "#999999",
  },
  footerValue: {
    fontSize: 10,
    color: "#222222",
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
  },
});

export type CertDocProps = {
  recipientName: string;
  courseTitle: string;
  issuedAt: Date;
  serial: string;
  verifyUrl?: string;
};

export function CertDoc({
  recipientName,
  courseTitle,
  issuedAt,
  serial,
  verifyUrl,
}: CertDocProps) {
  const formattedDate = issuedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document title={`Certificate ${serial}`} author="10kdjo">
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.innerBorder}>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.brand}>10KDJO</Text>
              <Text style={styles.eyebrow}>CERTIFICATE OF COMPLETION</Text>
              <Text style={styles.title}>Certificate of Completion</Text>

              <Text style={styles.subtitle}>This certifies that</Text>
              <Text style={styles.name}>{recipientName}</Text>
              <View style={styles.divider} />

              <Text style={styles.bodyLine}>has successfully completed</Text>
              <Text style={styles.courseTitle}>{courseTitle}</Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerColLeft}>
                <Text style={styles.footerLabel}>ISSUED</Text>
                <Text style={styles.footerValue}>{formattedDate}</Text>
              </View>
              <View style={styles.footerColRight}>
                <Text style={styles.footerLabel}>SERIAL</Text>
                <Text style={styles.footerValue}>{serial}</Text>
                {verifyUrl && (
                  <Text
                    style={{
                      fontSize: 7,
                      color: "#999999",
                      marginTop: 4,
                    }}
                  >
                    Verify at {verifyUrl}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
