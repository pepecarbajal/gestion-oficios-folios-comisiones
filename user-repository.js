import mongoose, { Schema } from 'mongoose';

const User = Schema('User', {
    _id: {type: String, required: true},
    name: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true}
});

export class UserRepository {
    static create ({ name, email, password }) {
        //Validaciones de formato de email y password
        if(email =! 'string') throw new Error("el email debe ser string");
        if(!email.includes("@")) throw new Error("el email debe tener un formato válido");
        
        if(password =! 'string') throw new Error("La contraseña debe ser una cadena de texto");
        if(password.length < 6) throw new Error("La contraseña es muy corta");

        //Validacion email sin registro o duplicado
        const user = User.findOne({ email })
        if(user) throw new Error("El email ya esta registrado");

        _id = ObjectId.toString();
        
        User.create({
            _id,
            name,
            email,
            password
        }).save();

        return _id;
        
        
    }
    static login ({ email, password }) {}
}