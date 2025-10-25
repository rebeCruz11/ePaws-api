const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name, role, phone, address } = req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json(
        errorResponse('El email ya está registrado')
      );
    }

    // Hashear password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario
    const userData = {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: role || 'user',
      phone,
      address
    };

    // Si es organización o veterinaria, inicializar campos específicos
    if (role === 'organization') {
      userData.organizationDetails = {
        organizationName: req.body.organizationName || name,
        description: req.body.description || '',
        capacity: req.body.capacity || 0,
        currentAnimals: 0,
        totalRescues: 0
      };
    }

    if (role === 'veterinary') {
      userData.veterinaryDetails = {
        clinicName: req.body.clinicName || name,
        licenseNumber: req.body.licenseNumber,
        specialties: req.body.specialties || [],
        totalCasesHandled: 0,
        rating: 0
      };

      // Si se proporcionan coordenadas, agregar ubicación
      if (req.body.latitude && req.body.longitude) {
        userData.veterinaryDetails.location = {
          type: 'Point',
          coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
        };
        userData.veterinaryDetails.locationAddress = req.body.locationAddress;
      }
    }

    const user = await User.create(userData);

    // Generar token
    const token = generateToken({ userId: user._id, role: user.role });

    res.status(201).json(
      successResponse({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          verified: user.verified
        }
      }, 'Usuario registrado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario incluyendo password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    
    if (!user) {
      return res.status(401).json(
        errorResponse('Credenciales inválidas')
      );
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      return res.status(403).json(
        errorResponse('Tu cuenta ha sido desactivada. Contacta al administrador.')
      );
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json(
        errorResponse('Credenciales inválidas')
      );
    }

    // Generar token
    const token = generateToken({ userId: user._id, role: user.role });

    // Preparar respuesta de usuario
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
      phone: user.phone,
      address: user.address,
      profilePhotoUrl: user.profilePhotoUrl
    };

    // Agregar detalles específicos según el rol
    if (user.role === 'organization' && user.organizationDetails) {
      userResponse.organizationDetails = user.organizationDetails;
    }

    if (user.role === 'veterinary' && user.veterinaryDetails) {
      userResponse.veterinaryDetails = user.veterinaryDetails;
    }

    res.status(200).json(
      successResponse({
        token,
        user: userResponse
      }, 'Inicio de sesión exitoso')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario actual
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // req.user ya está disponible gracias al authMiddleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json(
        errorResponse('Usuario no encontrado')
      );
    }

    res.status(200).json(
      successResponse(user)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar perfil del usuario
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      name,
      phone,
      address,
      profilePhotoUrl,
      // Campos de organización
      organizationName,
      description,
      website,
      socialMedia,
      logoUrl,
      capacity,
      // Campos de veterinaria
      clinicName,
      licenseNumber,
      specialties,
      latitude,
      longitude,
      locationAddress,
      businessHours
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(
        errorResponse('Usuario no encontrado')
      );
    }

    // Actualizar campos generales
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (profilePhotoUrl) user.profilePhotoUrl = profilePhotoUrl;

    // Actualizar campos específicos de organización
    if (user.role === 'organization') {
      if (organizationName) user.organizationDetails.organizationName = organizationName;
      if (description !== undefined) user.organizationDetails.description = description;
      if (website !== undefined) user.organizationDetails.website = website;
      if (socialMedia) user.organizationDetails.socialMedia = { ...user.organizationDetails.socialMedia, ...socialMedia };
      if (logoUrl !== undefined) user.organizationDetails.logoUrl = logoUrl;
      if (capacity !== undefined) user.organizationDetails.capacity = capacity;
    }

    // Actualizar campos específicos de veterinaria
    if (user.role === 'veterinary') {
      if (clinicName) user.veterinaryDetails.clinicName = clinicName;
      if (licenseNumber) user.veterinaryDetails.licenseNumber = licenseNumber;
      if (specialties) user.veterinaryDetails.specialties = specialties;
      if (businessHours !== undefined) user.veterinaryDetails.businessHours = businessHours;
      
      // Actualizar ubicación si se proporcionan coordenadas
      if (latitude && longitude) {
        user.veterinaryDetails.location = {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
      }
      if (locationAddress !== undefined) user.veterinaryDetails.locationAddress = locationAddress;
    }

    await user.save();

    res.status(200).json(
      successResponse(user, 'Perfil actualizado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar contraseña
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Buscar usuario con password
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      return res.status(404).json(
        errorResponse('Usuario no encontrado')
      );
    }

    // Verificar password actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json(
        errorResponse('Contraseña actual incorrecta')
      );
    }

    // Hashear nueva password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json(
      successResponse(null, 'Contraseña actualizada exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
