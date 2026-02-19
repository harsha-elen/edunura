import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

export enum UserRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    TEACHER = 'teacher',
    STUDENT = 'student',
}

interface UserAttributes {
    id: number;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_zip?: string;
    billing_country?: string;
    is_active: boolean;
    is_verified: boolean;
    last_login?: Date;
    reset_password_token?: string;
    reset_password_expires?: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active' | 'is_verified'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public email!: string;
    public password!: string;
    public first_name!: string;
    public last_name!: string;
    public role!: UserRole;
    public phone?: string;
    public avatar?: string;
    public bio?: string;
    public location?: string;
    public billing_address?: string;
    public billing_city?: string;
    public billing_state?: string;
    public billing_zip?: string;
    public billing_country?: string;
    public is_active!: boolean;
    public is_verified!: boolean;
    public last_login?: Date;
    public reset_password_token?: string;
    public reset_password_expires?: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Instance methods
    public async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }

    public toJSON(): Partial<UserAttributes> {
        const values: any = { ...this.get() };
        delete values.password;
        delete values.reset_password_token;
        delete values.reset_password_expires;
        return values;
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        first_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            allowNull: false,
            defaultValue: UserRole.STUDENT,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        billing_address: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        billing_city: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        billing_state: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        billing_zip: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        billing_country: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reset_password_token: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        reset_password_expires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'users',
        hooks: {
            beforeCreate: async (user: User) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user: User) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }
);

export default User;
