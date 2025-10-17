import * as React from "react";
import {Text, StyleSheet, Image, View} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



 // TÁ MUITO FEIO MAS É O CÓDIGO DIRETO DO FIGMA ADAPTADO

export function BannerLoja() {
  	
  	return (
      			<View style={[styles.view, styles.viewBg]}>
        				<Text style={styles.contribuaComOsContainer}>
          					<Text style={styles.contribuaComOs}>{`Contribua com os mapas, receba `}</Text>
          					<Text style={styles.moedas}>moedas</Text> {"\n"}
          					<Text style={styles.contribuaComOs}>e desbloqueie {"\n"}
                                funcionalidades {"\n"}temporárias!</Text>
        				</Text>
        				<Image source={require("../../assets/images/boyWithACoin.png")}style={styles.image} 
						 resizeMode="cover" />
      			</View>
	)
};

const styles = StyleSheet.create({
  	banner: {
    		flex: 1,
    		backgroundColor: "#f8f9fe"
  	},
  	viewBg: {
    		backgroundColor: "#f8f9fe",
  	},
  	view: {
    		width: "100%",
    		height: 221,
    		overflow: "hidden",
			position: "relative"
  	},
  	contribuaComOsContainer: {
    		top: 25,
    		left: 6,
    		fontSize: 24,
    		letterSpacing: 0.1,
    		fontWeight: "800",
    		fontFamily: "Inter-ExtraBold",
    		textAlign: "left",
    		width: 339,
    		position: "absolute"
  	},
  	contribuaComOs: {
    		color: "#000"
  	},
  	moedas: {
    		color: "#ffb37c"
  	},
  	image: {
    		bottom: 0,
			right: 0,
    		width: 138,
    		height: 142,
    		position: "absolute"
  	}
});

