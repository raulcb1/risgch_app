// app/landing/transparencia.tsx
import { useRouter } from 'expo-router';
import { AlertCircle, BookOpen, ExternalLink, FileText, Search } from 'lucide-react-native';
import React from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Tipos
type TransparencyOption = {
    id: number;
    title: string;
    description: string;
    icon: any;
    color: string;
    type: 'external' | 'internal';
    url?: string;
    route?: string;
};

const transparencyOptions: TransparencyOption[] = [
    {
        id: 1,
        title: 'Portal de Transparencia',
        description: 'Accede a toda la información pública de la entidad',
        icon: FileText,
        color: '#0066CC',
        type: 'external',
        url: 'https://www.transparencia.gob.pe/enlaces/pte_transparencia_enlaces.aspx?id_entidad=16361',
    },
    {
        id: 2,
        title: 'Solicitud de Acceso a la Información',
        description: 'Solicita información específica sobre nuestras operaciones',
        icon: Search,
        color: '#00A8E8',
        type: 'external',
        url: 'https://drive.google.com/file/d/1LMq1AnqoOnZYmg6rBBu_9Y12q5OKWSuE/view?usp=sharing',
    },
    {
        id: 3,
        title: 'Plataforma de Denuncias del Ciudadano',
        description: 'Reporta irregularidades o presenta quejas',
        icon: AlertCircle,
        color: '#0066CC',
        type: 'external',
        url: 'https://denuncias.servicios.gob.pe/?gobpe_id=800',
    },
    {
        id: 4,
        title: 'Normas de la Entidad',
        description: 'Consulta leyes, decretos y resoluciones',
        icon: BookOpen,
        color: '#00A8E8',
        type: 'internal',
        route: '../external/normas-publicas',
    },
];

export default function TransparencyScreen() {
    const router = useRouter();

    const handlePress = (option: TransparencyOption) => {
        if (option.type === 'external' && option.url) {
            const url = option.url.trim();
            Linking.openURL(url).catch((err) =>
                console.error('No se pudo abrir el enlace:', err)
            );
        } else if (option.type === 'internal' && option.route) {
            router.push(option.route as any);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Fijo */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <FileText size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>Transparencia</Text>
                <Text style={styles.subtitle}>Información pública al servicio de la ciudadanía</Text>
            </View>

            {/* ScrollView con contenido */}
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Contenido principal */}
                <View style={styles.content}>
                <Text style={styles.description}>
                    En cumplimiento con la Ley de Transparencia y Acceso a la Información Pública,
                    ponemos a tu disposición los siguientes recursos:
                </Text>

                {transparencyOptions.map((option, index) => {
                    const Icon = option.icon;

                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.optionCard}
                            activeOpacity={0.7}
                            onPress={() => handlePress(option)}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                                <Icon size={28} color="#FFFFFF" />
                            </View>
                            <View style={styles.optionContent}>
                                <View style={styles.optionHeader}>
                                    <Text style={styles.optionTitle}>{option.title}</Text>
                                    {option.type === 'external' && (
                                        <ExternalLink size={16} color="#6B7280" />
                                    )}
                                </View>
                                <Text style={styles.optionDescription}>{option.description}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.bottomSpacing} />
        </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0066CC',
        paddingTop: 60,
        paddingBottom: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        lineHeight: 22,
    },
    content: {
        padding: 24,
        paddingTop: 24,
        marginTop: 248,
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 24,
        textAlign: 'center',
    },
    optionCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    optionIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
        justifyContent: 'center',
    },
    optionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    optionDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    bottomSpacing: {
        height: 20,
    },
});