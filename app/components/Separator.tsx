import {View, StyleSheet} from "react-native"

export function Separator () {
    return (
        <View style={style.separator}/>
    )
}

const style = StyleSheet.create({
    separator: {
        height: 1,
        width: '100%',
        backgroundColor: '#D4D6DD'
    }
})