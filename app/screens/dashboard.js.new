import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { AuthContext } from '../../context/AuthContext';
import { fetchDashboardData } from '../../utils/api';

export default function DashboardScreen() {
  const router = useRouter();
  const { userInfo, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchDashboardData();
      setDashboardData(data);
      setCurrentTime(data.currentTime);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Update time every minute
  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      setCurrentTime(moment().format('MMMM Do YYYY, h:mm:ss a'));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
      </ThemedView>
    );
  }

  const renderTiles = () => {
    if (!dashboardData || !dashboardData.tiles || !Array.isArray(dashboardData.tiles)) {
      return null;
    }
    
    return dashboardData.tiles.map((tile) => (
      <TouchableOpacity
        key={tile.id.toString()}
        style={styles.tile}
        activeOpacity={0.8}
      >
        <View style={[styles.tileIconContainer, { backgroundColor: tile.color + '20' }]}>
          <FontAwesome name={tile.icon} size={28} color={tile.color} />
        </View>
        <View style={styles.tileContent}>
          <ThemedText style={styles.tileTitle}>
            {typeof tile.title === 'string' ? tile.title : ''}
          </ThemedText>
          <ThemedText style={[styles.tileCount, { color: tile.color }]}>
            {typeof tile.count === 'number' ? tile.count.toString() : 
             typeof tile.data === 'string' ? tile.data : ''}
          </ThemedText>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.welcomeContainer}>
          <ThemedText style={styles.welcomeText}>
            {`Welcome, ${userInfo?.username ? userInfo.username : 'Representative'}`}
          </ThemedText>
          <ThemedText style={styles.timeText}>
            {currentTime ? currentTime : 'Loading time...'}
          </ThemedText>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => router.push('/profile')}
          >
            <FontAwesome name="user" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <FontAwesome name="sign-out" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.dashboardHeader}>
          <View style={styles.headerCard}>
            <ThemedText style={styles.headerCardTitle}>Dashboard Overview</ThemedText>
            <View style={styles.divider} />
            <ThemedText style={styles.headerCardSubtitle}>
              Agency Representative Portal
            </ThemedText>
          </View>
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={32} color="#d32f2f" style={styles.errorIcon} />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <FontAwesome name="bar-chart" size={20} color="#2196F3" />
                <ThemedText style={styles.summaryValue}>Today</ThemedText>
                <ThemedText style={styles.summaryLabel}>Performance</ThemedText>
              </View>
              <View style={styles.summaryCard}>
                <FontAwesome name="calendar" size={20} color="#4CAF50" />
                <ThemedText style={styles.summaryValue}>5</ThemedText>
                <ThemedText style={styles.summaryLabel}>Meetings</ThemedText>
              </View>
              <View style={styles.summaryCard}>
                <FontAwesome name="bell" size={20} color="#FF9800" />
                <ThemedText style={styles.summaryValue}>3</ThemedText>
                <ThemedText style={styles.summaryLabel}>Notifications</ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.sectionTitle}>Activity Dashboard</ThemedText>
            <View style={styles.tilesContainer}>
              {renderTiles()}
            </View>

            <View style={styles.activitySection}>
              <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
              <View style={styles.activityCard}>
                <View style={styles.activityItem}>
                  <FontAwesome name="check-circle" size={18} color="#4CAF50" />
                  <ThemedText style={styles.activityText}>Completed client follow-up</ThemedText>
                  <ThemedText style={styles.activityTime}>11:32 AM</ThemedText>
                </View>
                <View style={styles.activityDivider} />
                <View style={styles.activityItem}>
                  <FontAwesome name="file-text" size={18} color="#2196F3" />
                  <ThemedText style={styles.activityText}>Report submitted for review</ThemedText>
                  <ThemedText style={styles.activityTime}>09:15 AM</ThemedText>
                </View>
                <View style={styles.activityDivider} />
                <View style={styles.activityItem}>
                  <FontAwesome name="calendar-check-o" size={18} color="#9C27B0" />
                  <ThemedText style={styles.activityText}>Meeting scheduled with client</ThemedText>
                  <ThemedText style={styles.activityTime}>Yesterday</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  welcomeContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 13,
    marginTop: 3,
    color: '#757575',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  dashboardHeader: {
    marginTop: 20,
    marginBottom: 15,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerCardSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '31%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 10,
    color: '#333',
  },
  tilesContainer: {
    flexDirection: 'column',
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tileContent: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  tileCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  errorIcon: {
    marginBottom: 10,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activitySection: {
    marginTop: 20,
    marginBottom: 30,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#eeeeee',
  },
});
