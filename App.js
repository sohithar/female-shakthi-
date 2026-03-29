import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  Linking, 
  Vibration,
  Platform,
  Switch,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors'; 

export default function App() {
  // --- STATE VARIABLES ---
  const [status, setStatus] = useState('IDLE'); 
  const [timer, setTimer] = useState(10); 
  const [level2Timer, setLevel2Timer] = useState(60); 
  const [callTimer, setCallTimer] = useState(0);

  // FEATURES STATE
  const [journeyModalVisible, setJourneyModalVisible] = useState(false);
  const [journeyActive, setJourneyActive] = useState(false);
  const [journeyTimeLeft, setJourneyTimeLeft] = useState(0);
  
  const [helplineModalVisible, setHelplineModalVisible] = useState(false);
  const [schemesModalVisible, setSchemesModalVisible] = useState(false);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [safeRouteModalVisible, setSafeRouteModalVisible] = useState(false);

  // SAFE ROUTE LOGIC
  const [routeDestination, setRouteDestination] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

  // SETTINGS & THEME
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // *** IMPROVED SHAKE SETTINGS ***
  // 1.8 is roughly 1.8G of force. (Standing still is 1.0G).
  // This prevents walking from triggering it, but a shake works.
  const [shakeSensitivity, setShakeSensitivity] = useState(1.8); 
  const [sensitivityName, setSensitivityName] = useState('Medium');
  const [useShake, setUseShake] = useState(true);

  // CONTACTS (Demo Data)
  const [contacts, setContacts] = useState([
    { id: '1', name: 'Dad', phone: '1234567890' },
    { id: '2', name: 'Mom', phone: '0987654321' }
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [medicalModalVisible, setMedicalModalVisible] = useState(false);
  const [safetyTipsModalVisible, setSafetyTipsModalVisible] = useState(false);
  const [sirenColor, setSirenColor] = useState('#ff3333');

  // MEDICAL ID STATE
  const [medicalId, setMedicalId] = useState({
    bloodType: 'O+',
    allergies: 'None',
    conditions: 'None',
    emergencyNote: 'Please contact my dad immediately.'
  });

  // --- ANIMATIONS ---
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start SOS Pulse animation
  useEffect(() => {
    if (status === 'IDLE') {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }
  }, [status]);

  // --- DATA ---
  const helplines = [
      { id: '1', title: 'Women Helpline', number: '1091', desc: '24/7 Support' },
      { id: '2', title: 'Domestic Abuse', number: '181', desc: 'Sakhi Center' },
      { id: '3', title: 'Police', number: '100', desc: 'Emergency' },
      { id: '4', title: 'Cyber Crime', number: '1930', desc: 'Online Fraud' },
      { id: '5', title: 'Child Line', number: '1098', desc: 'Kids Help' },
      { id: '6', title: 'Legal Aid', number: '15100', desc: 'Free Advice' },
  ];

  const schemes = [
      { id: '1', title: 'One Stop Centre', desc: 'Support for violence victims.', url: 'https://wcd.nic.in/schemes/one-stop-centre-scheme-1' },
      { id: '2', title: 'Universal Helpline', desc: 'Dial 181 Scheme.', url: 'https://wcd.nic.in/schemes/universalization-women-helpline-scheme' },
      { id: '3', title: 'Nirbhaya Fund', desc: 'Safety projects.', url: 'https://wcd.nic.in/schemes/nirbhaya-fund' },
      { id: '4', title: 'Swadhar Greh', desc: 'Shelter homes.', url: 'https://wcd.nic.in/schemes/swadhar-greh' },
  ];

  const safetyTips = [
      { id: '1', title: 'Self Defense', icon: 'hand-rock', color: '#ff5722', content: 'Use your palm to strike the nose or chin. Aim for vulnerable spots like the eyes or groin to escape.' },
      { id: '2', title: 'Digital Safety', icon: 'shield-alt', color: '#2196f3', content: 'Always share your live location with family. Keep your phone charged and avoid using headphones in dark alleys.' },
      { id: '3', title: 'Safe Travel', icon: 'car', color: '#4caf50', content: 'Note down the vehicle number when using public transport. Avoid taking isolated routes late at night.' },
      { id: '4', title: 'Legal Rights', icon: 'balance-scale', color: '#9c27b0', content: 'Zero FIR: You can file an FIR at any police station regardless of where the crime happened.' },
  ];
  
  const subscription = useRef(null);

  const theme = {
    bg: isDarkMode ? '#121212' : '#fff0f5', 
    text: isDarkMode ? '#ffffff' : '#333333',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    cardText: isDarkMode ? '#cccccc' : '#333333',
    header: isDarkMode ? '#1e1e1e' : 'rgba(255,255,255,0.9)',
    subText: isDarkMode ? '#888' : '#666'
  };

  // --- IMPROVED SENSOR LOGIC ---
  useEffect(() => {
    if (Platform.OS === 'web' || !useShake) return;
    
    const _subscribe = () => {
      subscription.current = Accelerometer.addListener(data => {
        const { x, y, z } = data;
        
        // Use Pythagorean Theorem (Magnitude of the 3D Vector)
        // This is much more accurate than x+y+z
        const totalForce = Math.sqrt(x * x + y * y + z * z);
        
        // If the total force exceeds our sensitivity threshold
        if (totalForce > shakeSensitivity) {
            checkShakeTrigger();
        }
      });
      // Check every 100ms (10 times a second)
      Accelerometer.setUpdateInterval(100); 
    };

    _subscribe();
    return () => { subscription.current && subscription.current.remove(); };
  }, [useShake, shakeSensitivity]);

  const checkShakeTrigger = () => {
    setStatus(currentStatus => {
        // Only trigger if we are IDLE and NOT in Journey mode
        if (currentStatus === 'IDLE' && !journeyActive) { 
            Vibration.vibrate(500);
            setTimer(10); 
            return 'COUNTDOWN';
        }
        return currentStatus;
    });
  };

  // --- SENSITIVITY CONTROL ---
  const changeSensitivity = (level) => {
      if (level === 'High') { 
          // 1.5G -> Very sensitive (light shake)
          setShakeSensitivity(1.5); 
          setSensitivityName('High'); 
      }
      if (level === 'Medium') { 
          // 1.8G -> Normal shake (Best for Demo)
          setShakeSensitivity(1.8); 
          setSensitivityName('Medium'); 
      }
      if (level === 'Low') { 
          // 2.2G -> Hard shake (Prevents accidents)
          setShakeSensitivity(2.2); 
          setSensitivityName('Low'); 
      }
  };

  // --- TIMERS ---
  useEffect(() => {
    let interval = null;
    if (status === 'COUNTDOWN') {
      if (timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
      else { setStatus('LEVEL2'); setLevel2Timer(60); Vibration.vibrate([500, 500, 500], true); }
    } 
    else if (status === 'LEVEL2') {
       if (level2Timer > 0) interval = setInterval(() => setLevel2Timer(t => t - 1), 1000);
       else triggerLevel3();
    }
    else if (status === 'FAKECALL_ACTIVE') {
        interval = setInterval(() => setCallTimer(t => t + 1), 1000);
    }
    if (journeyActive && journeyTimeLeft > 0) {
        const jInterval = setInterval(() => {
            setJourneyTimeLeft(prev => {
                if (prev <= 1) {
                    setJourneyActive(false);
                    triggerLevel3();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(jInterval);
    }
    return () => clearInterval(interval);
  }, [status, timer, level2Timer, journeyActive, journeyTimeLeft]);

  // SIREN FLASHING EFFECT
  useEffect(() => {
    let sirenInterval = null;
    if (status === 'LEVEL2' || status === 'LEVEL3') {
        sirenInterval = setInterval(() => {
            setSirenColor(prev => prev === '#ff3333' ? '#000000' : '#ff3333');
        }, 500);
    } else {
        setSirenColor('#ff3333');
    }
    return () => clearInterval(sirenInterval);
  }, [status]);

  // --- CORE FUNCTIONS ---
  const handleSOSPress = () => {
    if (status === 'IDLE') {
        setStatus('COUNTDOWN');
        setTimer(10);
        Vibration.vibrate(500); 
    }
  };

  const triggerLevel3 = () => {
    setStatus('LEVEL3');
    Vibration.vibrate([1000, 1000, 1000], true); 
    Alert.alert("🚨 SOS ACTIVATED", `Location sent to Police.\nNotifying: ${contacts.map(c => c.name).join(', ')}`);
  };

  const cancelAlarm = () => {
      Vibration.cancel();
      setStatus('IDLE');
      setTimer(10);
      setLevel2Timer(60);
  };

  // --- SAFE ROUTE LOGIC ---
  const analyzeRoutes = () => {
      if (!routeDestination) {
          Alert.alert("Error", "Please enter a destination");
          return;
      }
      setIsAnalyzing(true);
      setAnalysisDone(false);
      setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisDone(true);
      }, 2000); // 2 second fake loading
  };

  const openMaps = (query) => {
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(url);
  };

  // --- OTHER FUNCTIONS ---
  const startJourney = (min) => { setJourneyTimeLeft(min*60); setJourneyActive(true); setJourneyModalVisible(false); };
  const stopJourney = () => { setJourneyActive(false); setJourneyTimeLeft(0); Alert.alert("Safe", "Journey Ended"); };
  const addContact = () => { if(newContactName && newContactPhone) { setContacts([...contacts, {id: Date.now().toString(), name: newContactName, phone: newContactPhone}]); setNewContactName(''); setNewContactPhone(''); }};
  const removeContact = (id) => setContacts(contacts.filter(c => c.id !== id));
  const startFakeCall = () => { setStatus('FAKECALL_RINGING'); Vibration.vibrate([1000, 2000], true); };
  const answerFakeCall = () => { Vibration.cancel(); setStatus('FAKECALL_ACTIVE'); setCallTimer(0); };
  const endFakeCall = () => { Vibration.cancel(); setStatus('IDLE'); };
  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  // --- RENDER ---
  return (
    <View style={[styles.container, { backgroundColor: (status === 'LEVEL2' || status === 'LEVEL3') ? sirenColor : theme.bg }]}>
      
      {/* FAKE CALL */}
      {(status === 'FAKECALL_RINGING' || status === 'FAKECALL_ACTIVE') ? (
        <View style={styles.fakeCallScreen}>
            <View style={{alignItems: 'center', marginTop: 100}}>
                <View style={styles.avatarCircle}><Ionicons name="person" size={60} color="white" /></View>
                <Text style={styles.callerName}>Home</Text>
                <Text style={styles.callerStatus}>{status === 'FAKECALL_RINGING' ? 'Mobile...' : formatTime(callTimer)}</Text>
            </View>
            <View style={styles.callActions}>
                {status === 'FAKECALL_RINGING' ? (
                    <>
                    <TouchableOpacity style={[styles.callBtn, {backgroundColor: '#ff3b30'}]} onPress={endFakeCall}><Ionicons name="call" size={32} color="white" style={{transform:[{rotate:'135deg'}]}} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.callBtn, {backgroundColor: '#4cd964'}]} onPress={answerFakeCall}><Ionicons name="call" size={32} color="white" /></TouchableOpacity>
                    </>
                ) : (
                     <TouchableOpacity style={[styles.callBtn, {backgroundColor: '#ff3b30'}]} onPress={endFakeCall}><Ionicons name="call" size={32} color="white" style={{transform:[{rotate:'135deg'}]}} /></TouchableOpacity>
                )}
            </View>
        </View>
      ) : (

      // MAIN APP
      <View style={{flex: 1}}>
        <View style={[styles.header, { backgroundColor: theme.header }]}>
            <View>
                <Text style={styles.headerTitle}>ONE STOP</Text>
                <Text style={styles.headerSub}>
                    {status === 'IDLE' ? (journeyActive ? '🟢 TRACKING JOURNEY' : 'Safety & Support') : '⚠️ ALARM ACTIVE ⚠️'}
                </Text>
            </View>
            <View style={{flexDirection:'row', alignItems: 'center'}}>
                 <TouchableOpacity onPress={() => setSettingsVisible(true)} style={{marginRight: 15}}>
                    <Ionicons name="settings-sharp" size={24} color={theme.text} />
                </TouchableOpacity>
                 <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{false:"#767577", true:"#d63384"}}/>
            </View>
        </View>

        <View style={styles.content}>
            {journeyActive && status === 'IDLE' && (
                <View style={styles.journeyBanner}>
                    <MaterialIcons name="timer" size={24} color="white" />
                    <Text style={styles.journeyText}>Auto-SOS in: {formatTime(journeyTimeLeft)}</Text>
                    <TouchableOpacity style={styles.journeyStopBtn} onPress={stopJourney}><Text style={{color:'#d63384', fontWeight:'bold'}}>I'M SAFE</Text></TouchableOpacity>
                </View>
            )}

            {status === 'IDLE' && (
            <>
                <TouchableOpacity style={styles.sosButtonContainer} onPress={handleSOSPress}>
                    <Animated.View style={[styles.sosButton, { transform: [{ scale: pulseAnim }] }]}>
                        <Text style={styles.sosText}>SOS</Text>
                        <Text style={styles.sosSubText}>TAP OR SHAKE</Text>
                    </Animated.View>
                </TouchableOpacity>

                {/* --- MAIN GRID --- */}
                <View style={styles.grid}>
                    {/* Safe Route */}
                    <TouchableOpacity style={[styles.card, {backgroundColor: '#004aad'}]} onPress={() => setSafeRouteModalVisible(true)}>
                        <MaterialCommunityIcons name="google-maps" size={24} color="white" />
                        <Text style={[styles.cardText, {color: 'white'}]}>Safe Route</Text>
                    </TouchableOpacity>

                    {/* Journey */}
                    <TouchableOpacity style={[styles.card, {backgroundColor: 'orange'}]} onPress={() => setJourneyModalVisible(true)}>
                        <FontAwesome5 name="route" size={24} color="white" />
                        <Text style={[styles.cardText, {color: 'white'}]}>Journey</Text>
                    </TouchableOpacity>

                    {/* Safety Profile (NEW) */}
                    <TouchableOpacity style={[styles.card, {backgroundColor: '#d63384'}]} onPress={() => setMedicalModalVisible(true)}>
                        <FontAwesome5 name="user-plus" size={24} color="white" />
                        <Text style={[styles.cardText, {color: 'white'}]}>Safety Profile</Text>
                    </TouchableOpacity>

                    {/* Safety Knowledge (NEW) */}
                    <TouchableOpacity style={[styles.card, {backgroundColor: '#673ab7'}]} onPress={() => setSafetyTipsModalVisible(true)}>
                        <FontAwesome5 name="book-reader" size={24} color="white" />
                        <Text style={[styles.cardText, {color: 'white'}]}>Safety Tips</Text>
                    </TouchableOpacity>

                    {/* Police */}
                    <TouchableOpacity style={[styles.card, {backgroundColor: theme.card}]} onPress={() => openMaps("Police Station")}>
                        <FontAwesome5 name="shield-alt" size={24} color="#004aad" />
                        <Text style={[styles.cardText, {color: theme.cardText}]}>Police</Text>
                    </TouchableOpacity>

                    {/* Hospital */}
                    <TouchableOpacity style={[styles.card, {backgroundColor: theme.card}]} onPress={() => openMaps("Hospital")}>
                        <FontAwesome5 name="hospital" size={24} color="#d32f2f" />
                        <Text style={[styles.cardText, {color: theme.cardText}]}>Hospital</Text>
                    </TouchableOpacity>
                    
                    {/* Fake Call */}
                    <TouchableOpacity style={[styles.card, {backgroundColor: theme.card}]} onPress={startFakeCall}>
                        <MaterialIcons name="ring-volume" size={24} color="#0288d1" />
                        <Text style={[styles.cardText, {color: theme.cardText}]}>Fake Call</Text>
                    </TouchableOpacity>

                    {/* Helplines */}
                    <TouchableOpacity style={[styles.card, {backgroundColor: theme.card}]} onPress={() => setHelplineModalVisible(true)}>
                        <MaterialIcons name="support-agent" size={24} color="green" />
                        <Text style={[styles.cardText, {color: theme.cardText}]}>Helplines</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Schemes Full Width */}
                <TouchableOpacity style={[styles.fullWidthBtn, {backgroundColor: theme.card}]} onPress={() => setSchemesModalVisible(true)}>
                    <FontAwesome5 name="landmark" size={20} color="#d63384" />
                    <Text style={{fontWeight: 'bold', marginLeft: 10, color: theme.cardText}}>Government Schemes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{marginTop: 15}} onPress={() => setContactsModalVisible(true)}>
                    <Text style={{color: '#666', textDecorationLine: 'underline'}}>Manage Emergency Contacts</Text>
                </TouchableOpacity>
            </>
            )}

            {/* ALARMS */}
            {status === 'COUNTDOWN' && (
            <View style={styles.warningBox}>
                <Text style={styles.timerText}>{timer}</Text>
                <Text style={[styles.warningTitle, {color: theme.text}]}>ACCIDENTAL CHECK</Text>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelAlarm}><Text style={styles.cancelText}>CANCEL</Text></TouchableOpacity>
            </View>
            )}
            {status === 'LEVEL2' && (
            <View style={styles.emergencyBox}>
                <MaterialIcons name="volume-off" size={80} color="white" />
                <Text style={styles.emergencyTitle}>SIREN ACTIVE</Text>
                <TouchableOpacity style={styles.stopButton} onPress={cancelAlarm}><Text style={styles.stopText}>STOP</Text></TouchableOpacity>
            </View>
            )}
            {status === 'LEVEL3' && (
            <View style={styles.emergencyBox}>
                <MaterialIcons name="mark-email-read" size={80} color="white" />
                <Text style={styles.emergencyTitle}>ALERTS SENT</Text>
                <Text style={{color: 'white', marginBottom: 20}}>Live Location: 28.6139° N, 77.2090° E</Text>
                
                {/* EMERGENCY MEDICAL CARD DISPLAY */}
                <View style={styles.medicalDisplayCard}>
                    <Text style={styles.medicalCardHeader}>🚨 MEDICAL ID</Text>
                    <View style={styles.medicalRow}>
                        <Text style={styles.medicalLabel}>Blood:</Text>
                        <Text style={styles.medicalValue}>{medicalId.bloodType}</Text>
                    </View>
                    <View style={styles.medicalRow}>
                        <Text style={styles.medicalLabel}>Allergies:</Text>
                        <Text style={styles.medicalValue}>{medicalId.allergies}</Text>
                    </View>
                    <View style={styles.medicalRow}>
                        <Text style={styles.medicalLabel}>Conditions:</Text>
                        <Text style={styles.medicalValue}>{medicalId.conditions}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.stopButton} onPress={cancelAlarm}><Text style={styles.stopText}>I AM SAFE</Text></TouchableOpacity>
            </View>
            )}
        </View>

        {/* --- MODAL: SAFE ROUTE --- */}
        <Modal visible={safeRouteModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSafeRouteModalVisible(false)}>
            <View style={[styles.modalContainer, {backgroundColor: theme.bg}]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: theme.text}]}>Safe Navigation</Text>
                    <TouchableOpacity onPress={() => setSafeRouteModalVisible(false)}><Ionicons name="close-circle" size={30} color={theme.text} /></TouchableOpacity>
                </View>
                
                {!analysisDone ? (
                    <View>
                        <Text style={{color: theme.text, marginBottom: 10}}>Destination:</Text>
                        <TextInput 
                            placeholder="e.g. Home" 
                            placeholderTextColor="#999" 
                            style={[styles.input, {color:theme.text, borderColor:theme.text, marginBottom: 20}]} 
                            value={routeDestination} 
                            onChangeText={setRouteDestination}
                        />
                        {isAnalyzing ? (
                            <View style={{alignItems: 'center'}}>
                                <ActivityIndicator size="large" color="#d63384" />
                                <Text style={{color: theme.subText, marginTop: 10}}>Checking street safety...</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.journeyBtn} onPress={analyzeRoutes}>
                                <Text style={styles.journeyBtnText}>Find Safe Route</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View>
                        <Text style={{color: theme.subText, marginBottom: 20}}>Results for: {routeDestination}</Text>
                        
                        {/* Fast Route */}
                        <TouchableOpacity style={[styles.helplineCard, {backgroundColor: theme.card, opacity: 0.8}]} onPress={() => openMaps(routeDestination)}>
                            <View>
                                <Text style={[styles.helplineTitle, {color: theme.text}]}>Fastest Route</Text>
                                <Text style={{color: 'orange'}}>⚠️ 15 min • Dark Zones Detected</Text>
                            </View>
                            <Feather name="arrow-right-circle" size={24} color={theme.text} />
                        </TouchableOpacity>

                        {/* Safe Route */}
                        <TouchableOpacity style={[styles.helplineCard, {backgroundColor: '#e8f5e9', borderColor: 'green', borderWidth: 2}]} onPress={() => openMaps(routeDestination)}>
                            <View>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={[styles.helplineTitle, {color: 'black'}]}>Safe Route </Text>
                                    <MaterialIcons name="verified" size={16} color="green" />
                                </View>
                                <Text style={{color: 'green', fontWeight: 'bold'}}>✅ 18 min • Well Lit • Patrolled</Text>
                            </View>
                            <View style={{backgroundColor: 'green', padding: 5, borderRadius: 20}}>
                                <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>BEST</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>

        {/* --- MODAL: SCHEMES --- */}
        <Modal visible={schemesModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSchemesModalVisible(false)}>
            <View style={[styles.modalContainer, {backgroundColor: theme.bg}]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: theme.text}]}>Govt Schemes</Text>
                    <TouchableOpacity onPress={() => setSchemesModalVisible(false)}><Ionicons name="close-circle" size={30} color={theme.text} /></TouchableOpacity>
                </View>
                <FlatList data={schemes} keyExtractor={i => i.id} renderItem={({item}) => (
                    <TouchableOpacity style={[styles.helplineCard, {backgroundColor: theme.card}]} onPress={() => Linking.openURL(item.url)}>
                        <View style={{flex: 1}}>
                            <Text style={[styles.helplineTitle, {color: theme.text}]}>{item.title}</Text>
                            <Text style={{color: theme.subText, fontSize: 12}}>{item.desc}</Text>
                        </View>
                        <Feather name="external-link" size={20} color={theme.text} />
                    </TouchableOpacity>
                )}/>
            </View>
        </Modal>

        {/* --- MODAL: HELPLINES --- */}
        <Modal visible={helplineModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHelplineModalVisible(false)}>
            <View style={[styles.modalContainer, {backgroundColor: theme.bg}]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: theme.text}]}>Helplines</Text>
                    <TouchableOpacity onPress={() => setHelplineModalVisible(false)}><Ionicons name="close-circle" size={30} color={theme.text} /></TouchableOpacity>
                </View>
                <FlatList data={helplines} keyExtractor={i => i.id} renderItem={({item}) => (
                    <TouchableOpacity style={[styles.helplineCard, {backgroundColor: theme.card}]} onPress={() => Linking.openURL(`tel:${item.number}`)}>
                        <View>
                            <Text style={[styles.helplineTitle, {color: theme.text}]}>{item.title}</Text>
                            <Text style={{color: theme.subText}}>{item.desc}</Text>
                        </View>
                        <View style={styles.callIconBtn}><Ionicons name="call" size={20} color="white" /></View>
                    </TouchableOpacity>
                )}/>
            </View>
        </Modal>

        {/* --- MODAL: JOURNEY --- */}
        <Modal visible={journeyModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setJourneyModalVisible(false)}>
            <View style={[styles.modalContainer, {backgroundColor: theme.bg}]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: theme.text}]}>Safe Journey</Text>
                    <TouchableOpacity onPress={() => setJourneyModalVisible(false)}><Ionicons name="close-circle" size={30} color={theme.text} /></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.journeyBtn} onPress={() => startJourney(0.1)}><Text style={styles.journeyBtnText}>Demo (6s)</Text></TouchableOpacity>
                <TouchableOpacity style={styles.journeyBtn} onPress={() => startJourney(15)}><Text style={styles.journeyBtnText}>15 Minutes</Text></TouchableOpacity>
            </View>
        </Modal>

        {/* --- MODAL: CONTACTS --- */}
        <Modal visible={contactsModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setContactsModalVisible(false)}>
             <View style={[styles.modalContainer, {backgroundColor: theme.bg}]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: theme.text}]}>Contacts</Text>
                    <TouchableOpacity onPress={() => setContactsModalVisible(false)}><Ionicons name="close-circle" size={30} color={theme.text} /></TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                    <TextInput placeholder="Name" placeholderTextColor="#999" style={[styles.input, {color:theme.text, borderColor:theme.text, flex:1}]} value={newContactName} onChangeText={setNewContactName}/>
                    <TextInput placeholder="Phone" placeholderTextColor="#999" keyboardType="phone-pad" style={[styles.input, {color:theme.text, borderColor:theme.text, flex:1}]} value={newContactPhone} onChangeText={setNewContactPhone}/>
                    <TouchableOpacity style={styles.addBtn} onPress={addContact}><Ionicons name="add" size={24} color="white" /></TouchableOpacity>
                </View>
                <FlatList data={contacts} keyExtractor={i=>i.id} renderItem={({item})=>(
                    <View style={[styles.contactItem, {backgroundColor: theme.card}]}>
                        <Text style={[styles.contactName, {color: theme.cardText}]}>{item.name}</Text>
                        <TouchableOpacity onPress={()=>removeContact(item.id)}><Ionicons name="trash" size={24} color="red" /></TouchableOpacity>
                    </View>
                )}/>
            </View>
        </Modal>

        {/* --- MODAL: SETTINGS --- */}
        <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSettingsVisible(false)}>
             <View style={[styles.modalContainer, {backgroundColor: theme.bg}]}>
                 <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: theme.text}]}>Settings</Text>
                    <TouchableOpacity onPress={() => setSettingsVisible(false)}><Ionicons name="close-circle" size={30} color={theme.text} /></TouchableOpacity>
                </View>
                 <View style={[styles.settingSection, {backgroundColor: theme.card}]}>
                     <Text style={[styles.settingTitle, {color: theme.text}]}>Shake Detection</Text>
                    <View style={styles.switchRow}>
                        <Text style={{color: theme.text}}>Enable Shake</Text>
                        <Switch value={useShake} onValueChange={setUseShake} trackColor={{true:"#d63384"}}/>
                    </View>
                    <Text style={{color: theme.subText, marginBottom: 15}}>Sensitivity: {sensitivityName}</Text>
                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                         <TouchableOpacity style={[styles.sensBtn, shakeSensitivity===1.5 && styles.sensBtnActive]} onPress={()=>changeSensitivity('High')}><Text style={styles.sensText}>High</Text></TouchableOpacity>
                         <TouchableOpacity style={[styles.sensBtn, shakeSensitivity===1.8 && styles.sensBtnActive]} onPress={()=>changeSensitivity('Medium')}><Text style={styles.sensText}>Med</Text></TouchableOpacity>
                         <TouchableOpacity style={[styles.sensBtn, shakeSensitivity===2.2 && styles.sensBtnActive]} onPress={()=>changeSensitivity('Low')}><Text style={styles.sensText}>Low</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        {/* --- MODAL: MEDICAL ID --- */}
        <Modal visible={medicalModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMedicalModalVisible(false)}>
            <View style={[styles.modalContainer, {backgroundColor: theme.bg}]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: theme.text}]}>Medical Profile</Text>
                    <TouchableOpacity onPress={() => setMedicalModalVisible(false)}><Ionicons name="close-circle" size={30} color={theme.text} /></TouchableOpacity>
                </View>
                <View style={[styles.settingSection, {backgroundColor: theme.card}]}>
                    <Text style={[styles.settingTitle, {color: theme.text}]}>Blood Type</Text>
                    <TextInput style={[styles.input, {color:theme.text, borderColor:theme.text, marginBottom: 15}]} value={medicalId.bloodType} onChangeText={t => setMedicalId({...medicalId, bloodType: t})}/>
                    
                    <Text style={[styles.settingTitle, {color: theme.text}]}>Allergies</Text>
                    <TextInput style={[styles.input, {color:theme.text, borderColor:theme.text, marginBottom: 15}]} value={medicalId.allergies} onChangeText={t => setMedicalId({...medicalId, allergies: t})}/>
                    
                    <Text style={[styles.settingTitle, {color: theme.text}]}>Chronic Conditions</Text>
                    <TextInput style={[styles.input, {color:theme.text, borderColor:theme.text, marginBottom: 15}]} value={medicalId.conditions} onChangeText={t => setMedicalId({...medicalId, conditions: t})}/>
                    
                    <Text style={[styles.settingTitle, {color: theme.text}]}>Emergency Note</Text>
                    <TextInput style={[styles.input, {color:theme.text, borderColor:theme.text, height: 80, textAlignVertical: 'top'}]} multiline value={medicalId.emergencyNote} onChangeText={t => setMedicalId({...medicalId, emergencyNote: t})}/>
                </View>
                <TouchableOpacity style={styles.journeyBtn} onPress={() => setMedicalModalVisible(false)}>
                    <Text style={styles.journeyBtnText}>Save Profile</Text>
                </TouchableOpacity>
            </View>
        </Modal>

        {/* --- MODAL: SAFETY TIPS --- */}
        <Modal visible={safetyTipsModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSafetyTipsModalVisible(false)}>
            <View style={[styles.modalContainer, {backgroundColor: theme.bg}]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: theme.text}]}>Safety Knowledge</Text>
                    <TouchableOpacity onPress={() => setSafetyTipsModalVisible(false)}><Ionicons name="close-circle" size={30} color={theme.text} /></TouchableOpacity>
                </View>
                <FlatList 
                    data={safetyTips} 
                    keyExtractor={i => i.id} 
                    renderItem={({item}) => (
                        <View style={[styles.tipCard, {backgroundColor: theme.card}]}>
                            <View style={[styles.tipIconBox, {backgroundColor: item.color}]}>
                                <FontAwesome5 name={item.icon} size={20} color="white" />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={[styles.tipTitle, {color: theme.text}]}>{item.title}</Text>
                                <Text style={{color: theme.subText, fontSize: 13}}>{item.content}</Text>
                            </View>
                        </View>
                    )}
                />
            </View>
        </Modal>
      </View>
      )}
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#d63384' },
  headerSub: { color: '#666', fontWeight: '600', fontSize: 12 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  sosButtonContainer: { marginBottom: 30 },
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#ff0040', alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: '#ff6685', elevation: 15, shadowColor: '#ff0040', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10 },
  sosText: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  sosSubText: { color: 'white', fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  card: { width: '48%', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15, elevation: 2 },
  cardText: { marginTop: 8, fontWeight: '600', fontSize: 12, textAlign: 'center' },
  fullWidthBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, elevation: 2 },
  journeyBanner: { width: '100%', backgroundColor: '#d63384', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, elevation: 5 },
  journeyText: { color: 'white', fontWeight: 'bold', marginLeft: 10, flex: 1 },
  journeyStopBtn: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  journeyBtn: { backgroundColor: '#d63384', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  journeyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  helplineCard: { padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  helplineTitle: { fontSize: 16, fontWeight: 'bold' },
  callIconBtn: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 20 },
  warningBox: { alignItems: 'center' },
  timerText: { fontSize: 80, fontWeight: 'bold', color: 'orange', marginVertical: 10 },
  warningTitle: { fontSize: 22, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 30, marginTop: 20, width: 200, alignItems: 'center' },
  cancelText: { color: 'white', fontWeight: 'bold' },
  emergencyBox: { alignItems: 'center', width: '100%' },
  emergencyTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginVertical: 20 },
  stopButton: { backgroundColor: 'white', padding: 15, borderRadius: 30, width: 200, alignItems: 'center', marginTop: 10 },
  stopText: { fontWeight: 'bold', color: '#ff3333' },
  medicalDisplayCard: { backgroundColor: 'white', width: '90%', borderRadius: 15, padding: 15, marginBottom: 20 },
  medicalCardHeader: { fontSize: 18, fontWeight: 'bold', color: '#d32f2f', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5, marginBottom: 10 },
  medicalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  medicalLabel: { fontWeight: 'bold', color: '#666' },
  medicalValue: { color: '#333' },
  tipCard: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center', elevation: 2 },
  tipIconBox: { width: 45, height: 45, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  tipTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  fakeCallScreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0f1c24', zIndex: 999, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 80 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#37474f', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  callerName: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  callerStatus: { fontSize: 18, color: '#b0bec5', marginTop: 10 },
  callActions: { flexDirection: 'row', width: '80%', justifyContent: 'space-around', alignItems: 'center' },
  callBtn: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1, padding: 20, paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', marginBottom: 20 },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginRight: 0 },
  addBtn: { backgroundColor: '#d63384', padding: 12, borderRadius: 8, justifyContent: 'center' },
  contactItem: { padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactName: { fontWeight: 'bold', fontSize: 16 },
  settingSection: { padding: 20, borderRadius: 15, marginBottom: 20 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  sensBtn: { flex: 1, backgroundColor: '#ddd', padding: 10, alignItems: 'center', marginHorizontal: 5, borderRadius: 8 },
  sensBtnActive: { backgroundColor: '#d63384' },
  sensText: { fontWeight: 'bold', color: '#333' }
});