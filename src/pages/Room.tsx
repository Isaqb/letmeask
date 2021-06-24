import { useEffect } from 'react';
import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';

import logoImg from '../assets/images/logo.svg';

import { Button } from '../components/Button';
import { RoomCode } from '../components/RoomCode';
import { useAuth } from '../hooks/useAuth';
import { database } from '../services/firebase';

import '../styles/room.scss';

type  RoomParams={
    id: string;
}

type FirebaseQuestions = Record<string, {
    author:{
        avatar: string,
        name: string
    }
    content: string,
    isAnswered: boolean,
    isHighlighted: boolean
}> // é uma objeto cuja chave é uma string

type Questions = {
    id: string,
    author:{
        avatar: string,
        name: string
    }
    content: string,
    isAnswered: boolean,
    isHighlighted: boolean
}

export function Room(){
    const {user} = useAuth();
    const params = useParams<RoomParams>();
    const [newQuestion, setNewQuestion] = useState('');
    const [questions, setQuestions] = useState<Questions[]>([]);
    const [title, setTitle] = useState();

    const roomId = params.id;

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
                }
            });//transforma objeto em array

            setTitle(databaseRoom.title);
            setQuestions(parsedQuestions);
        })
    } , [roomId]);//código executa toda vez que o id muda

    async function handleSendQuestion(event: FormEvent) {
        event.preventDefault();

        if(newQuestion.trim() === ''){
            return;
        }

        if(!user){
            throw new Error('You must be logged in');
        }

        const question = {
            content: newQuestion,
            author: {
                name: user.name,
                avatar: user.avatar
            },
            isHighlighted: false,
            isAnswered: false
        };

        await database.ref(`rooms/${roomId}/questions`).push(question);
        
        setNewQuestion('');
    }

    return(
        <div id="page-room">
            <header>
                <div className="content">
                   <img src={logoImg} alt="Letmeask" />
                    <RoomCode code={roomId}/> 
                </div>
            </header>
            <main className="content">
                <div className="room-title">
                    <h1>Sala {title}</h1>
                    {questions.length > 0 && <span>{questions.length} pergunta(s)</span> }
                    
                </div>
                <form onSubmit={handleSendQuestion}>
                    <textarea 
                        placeholder="O que você quer perguntar?"
                        onChange = {event => setNewQuestion(event.target.value)}
                        value={newQuestion}
                    ></textarea>
                    <div className="form-footer">
                        { user ?(
                            <div className="user-info">
                                <img src={user.avatar}alt={user.name} />
                                <span>{user.name}</span>
                            </div>
                        ):( 
                            <span>Para enviar uma pergunta, <button>faça login</button>.</span>
                        )}
                       
                        <Button type="submit" disabled={!user} >Enviar pergunta</Button>
                    </div>
                </form>
                {JSON.stringify(questions)}
            </main>
        </div>
    );
}