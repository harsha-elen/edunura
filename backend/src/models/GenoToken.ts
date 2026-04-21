import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface GenoTokenAttributes {
    id: number;
    user_id: number;
    token: string;
    created_at?: Date;
    expires_at: Date;
    revoked?: boolean;
}

interface GenoTokenCreationAttributes extends Optional<GenoTokenAttributes, 'id' | 'created_at' | 'revoked'> { }

class GenoToken extends Model<GenoTokenAttributes, GenoTokenCreationAttributes> implements GenoTokenAttributes {
    public id!: number;
    public user_id!: number;
    public token!: string;
    public created_at!: Date;
    public expires_at!: Date;
    public revoked!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

GenoToken.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        token: {
            type: DataTypes.STRING(512),
            allowNull: false,
            unique: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        revoked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'geneo_tokens',
        timestamps: false,
    }
);

export default GenoToken;
