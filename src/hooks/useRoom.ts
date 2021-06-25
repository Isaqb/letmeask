import { useEffect, useState } from "react";

import { database } from "../services/firebase";
import { useAuth } from "./useAuth";

type FirebaseQuestions = Record<string, {
    author:{
        avatar: string,
        name: string
    }
    content: string,
    isAnswered: boolean,
    isHighlighted: boolean,
    likes: Record<string, {
        authorId: string
    }>
}> // é uma objeto cuja chave é uma string

type Questions = {
    id: string;
    author:{
        avatar: string;
        name: string;
    }
    content: string;
    isAnswered: boolean;
    isHighlighted: boolean;
    likeCount:number;
    likeId: string | undefined;
}

export function useRoom(roomId:string){
    const { user } =useAuth();
    const [questions, setQuestions] = useState<Questions[]>([]);
    const [title, setTitle] = useState();

     //listar as perguntas da sala
     useEffect(() =>{ //quando vazio executa somente uma vez
        const roomRef = database.ref(`rooms/${roomId}`);

        //ouvindo o tempo todo, só que recarregada tudo sempre. sala com muitas perguntas pode ficar lento
        //deveria ouvir somente e preencher somente valor modificado
        //funcional para aplicações menores. para melhorar consultar eventos do firebasa
        roomRef.on('value', room => {//unica vez -> once, mais vezes->on
            const databaseRoom = room.val();
            const firebaseQuestions : FirebaseQuestions = databaseRoom.questions;

            const parsedQuestions = Object.entries(firebaseQuestions ?? {}).map(([key,value])=> {//desestruturação
                return {
                    id: key,
                    content: value.content,
                    author: value.author,
                    isAnswered: value.isAnswered,
                    isHighlighted: value.isHighlighted,
                    likeCount: Object.values(value.likes ?? {}).length,
                    likeId: Object.entries(value.likes ?? {}).find(([key,like]) => like.authorId == user?.id)?.[0],
                }
            });//transforma objeto em array

            setTitle(databaseRoom.title);
            setQuestions(parsedQuestions);
        })

        return () =>{
            roomRef.off('value');//remover event listener
        }

    } , [roomId, user?.id]);//código executa toda vez que o id muda

    return { questions,title };

}