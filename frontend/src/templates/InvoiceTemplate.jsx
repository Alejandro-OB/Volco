import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// You might need to add fonts depending on how htmldocs// Registrar la fuente Open Sans
Font.register({
    family: 'Open Sans',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf', fontWeight: 400 },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-italic.ttf', fontWeight: 400, fontStyle: 'italic' },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700italic.ttf', fontWeight: 700, fontStyle: 'italic' }
    ]
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Open Sans',
        padding: '40px',
        backgroundColor: '#fff',
        fontSize: 12,
        color: '#333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        borderBottomStyle: 'solid'
    },
    logoContainer: {
        width: '50%'
    },
    logo: {
        maxWidth: 120,
        maxHeight: 80,
        objectFit: 'contain'
    },
    headerText: {
        width: '50%',
        textAlign: 'right'
    },
    invoiceTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: '#1b4332',
        textTransform: 'uppercase'
    },
    date: {
        fontSize: 11,
        color: '#777',
        marginTop: 4
    },
    sectionTitle: {
        fontSize: 26,
        fontWeight: 700,
        color: '#1b4332',
        textAlign: 'center',
        marginVertical: 15,
        letterSpacing: 1
    },
    infoBox: {
        borderWidth: 1.5,
        borderColor: '#1b4332',
        borderStyle: 'solid',
        borderRadius: 6,
        padding: 12,
        marginBottom: 20
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 4
    },
    bold: {
        fontWeight: 600,
        color: '#1b4332'
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row'
    },
    tableHeader: {
        backgroundColor: '#1b4332',
        color: '#fff',
        fontWeight: 700,
        textAlign: 'center'
    },
    tableColHeader: {
        width: '20%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#1b4332',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 6
    },
    tableCol: {
        width: '20%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#ccc',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 6
    },
    tableCellHeader: {
        fontSize: 11,
        textTransform: 'uppercase',
        color: '#fff'
    },
    tableCell: {
        fontSize: 11,
        textAlign: 'center'
    },
    paymentSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25
    },
    bankBox: {
        width: '45%',
        borderWidth: 1.5,
        borderColor: '#1b4332',
        borderStyle: 'solid',
        borderRadius: 6,
        padding: 12
    },
    bankTitle: {
        fontWeight: 700,
        color: '#1b4332',
        marginBottom: 4
    },
    totalContainer: {
        backgroundColor: '#f4f9f7',
        borderWidth: 2,
        borderColor: '#1b4332',
        borderStyle: 'solid',
        borderRadius: 6,
        padding: 15,
        width: '40%',
        textAlign: 'right',
        marginLeft: 'auto'
    },
    totalLabel: {
        fontSize: 13,
        color: '#1b4332',
        fontWeight: 600
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 700,
        color: '#0b3d2e',
        marginTop: 5
    },
    signatureContainer: {
        marginTop: 30,
        alignItems: 'flex-end'
    },
    signatureImg: {
        width: 140,
        marginBottom: 5
    },
    signatureLine: {
        width: 140,
        height: 1,
        backgroundColor: '#bbb',
        marginBottom: 5
    },
    signatureName: {
        fontWeight: 600,
        fontStyle: 'italic',
        color: '#1b4332',
        fontSize: 13
    },
    signatureDoc: {
        color: '#666',
        fontSize: 11
    },
    footer: {
        marginTop: 30,
        textAlign: 'center',
        color: '#1b4332',
        fontStyle: 'italic',
        fontSize: 11
    }
});

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
};

const InvoiceTemplate = ({ invoice, custom, services, provider, invoicesTotal }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        {custom?.include_logo && custom?.logo_url && (
                            <Image style={styles.logo} src={custom.logo_url} />
                        )}
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.invoiceTitle}>CUENTA DE COBRO N° {invoice?.invoice_number}</Text>
                        <Text style={styles.date}>{formatDate(invoice?.invoice_date)}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.sectionTitle}>CUENTA DE COBRO</Text>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Text style={styles.bold}>Cliente: </Text>
                        <Text>{invoice?.service_account?.client?.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.bold}>Periodo: </Text>
                        <Text>{formatDate(invoice?.service_account?.start_date)} — {formatDate(invoice?.service_account?.end_date)}</Text>
                    </View>
                    {custom?.service_text && (
                        <View style={styles.infoRow}>
                            <Text style={styles.bold}>Servicio: </Text>
                            <Text>{custom.service_text}</Text>
                        </View>
                    )}
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Fecha</Text></View>
                        <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Servicio</Text></View>
                        <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Cantidad</Text></View>
                        <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Precio Unitario</Text></View>
                        <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Total</Text></View>
                    </View>

                    {services?.map((s, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatDate(s.service_date)}</Text></View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{s.custom_material ? `Viaje de ${s.custom_material}` : s.material ? `Viaje de ${s.material.name}` : 'Viaje sin material'}</Text>
                            </View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{s.quantity}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(s.price)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(s.total_amount)}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Payment Section */}
                <View style={styles.paymentSection}>
                    {custom?.include_bank_info && custom?.provider_bank && (
                        <View style={styles.bankBox}>
                            <Text style={styles.bankTitle}>Información bancaria:</Text>
                            <Text>Banco: {custom.provider_bank}</Text>
                            <Text>Tipo de cuenta: {custom.provider_type_account}</Text>
                            <Text>Número de cuenta: {custom.provider_number_account}</Text>
                        </View>
                    )}

                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total a pagar:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(invoicesTotal)}</Text>
                    </View>
                </View>

                {/* Signature */}
                {custom?.signature_url && custom?.include_signature && (
                    <View style={styles.signatureContainer}>
                        <Image style={styles.signatureImg} src={custom.signature_url} />
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>{provider?.name}</Text>
                        {provider?.document_number && (
                            <Text style={styles.signatureDoc}>CC: {provider.document_number}</Text>
                        )}
                    </View>
                )}

                {/* Footer Message */}
                {custom?.include_footer && custom?.footer_message && (
                    <Text style={styles.footer}>{custom.footer_message}</Text>
                )}            </Page>
        </Document>
    );
};

export default InvoiceTemplate;
