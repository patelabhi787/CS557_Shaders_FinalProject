#version 330 compatibility
 
uniform sampler3D Noise3;
uniform float uNoiseAmp;
uniform float uNoiseFreq;

in vec2 vST;
in vec3 vN;
in vec3 vL;
in vec3 vE;
in vec3 vMCposition;

uniform sampler2D splatmap;
uniform sampler2D texture1Height;
uniform sampler2D texture2Height;
uniform sampler2D texture1Diffuse;
uniform sampler2D texture2Diffuse;
uniform sampler2D texture1Normal;
uniform sampler2D texture2Normal;
uniform vec3 uColor;
uniform vec4 uAmbientColor;

vec3
RotateNormal( float angx, float angy, vec3 n )
{
        float cx = cos( angx );
        float sx = sin( angx );
        float cy = cos( angy );
        float sy = sin( angy );

        // rotate about x:
        float yp =  n.y*cx - n.z*sx;    // y'
        n.z      =  n.y*sx + n.z*cx;    // z'
        n.y      =  yp;
        // n.x      =  n.x;

        // rotate about y:
        float xp =  n.x*cy + n.z*sy;    // x'
        n.z      = -n.x*sy + n.z*cy;    // z'
        n.x      =  xp;
        // n.y      =  n.y;

        return normalize( n );
}

vec4 CalculateTheLighting(vec3 diffuseColor, vec3 specularIntensity, vec3 normal) {
	float shininess = 50.;	
	vec3 light = normalize(vL);
	vec3 eye = normalize(vE);
	
	vec3 ambient = uAmbientColor.rgb * (1 - max( dot(normal, light), 0. )) * diffuseColor;
	vec3 diffuse = diffuseColor * max( dot(normal, light), 0. ) * uColor;	
	vec3 specular = vec3(0.);
	
	if( dot(normal, light) > 0. ) {
		vec3 ref = normalize( 2. * normal * dot(normal, light) - light );
		specular = pow(max(dot(eye, ref), 0.), shininess) * (vec3(1.) - specularIntensity);
	}
	return vec4(ambient + diffuse + specular * 0.2, 1.);
}

void main() {
	float bias1 = texture(splatmap, vST).r;
	float bias2 = texture(splatmap, vST).g;
	
	vec4 nvx = texture( Noise3, uNoiseFreq*vMCposition );
	float angx = nvx.r + nvx.g + nvx.b + nvx.a  -  2.;	// -1. to +1.
	angx *= uNoiseAmp;

    vec4 nvy = texture( Noise3, uNoiseFreq*vec3(vMCposition.xy,vMCposition.z+0.5) );
	float angy = nvy.r + nvy.g + nvy.b + nvy.a  -  2.;	// -1. to +1.
	angy *= uNoiseAmp;

	// rotating normal
	vec3 normal = RotateNormal(angx, angy, vN);

    // Find the blending factor based on heights and biases
    float blendFactor = smoothstep(0.0, 1.0, (texture(texture2Height, vST).r * bias2 - texture(texture1Height, vST).r * bias1) * 10.0);

	vec3 baseTextureDiffuseColor = texture(texture1Diffuse, vST).rgb;
	vec3 baseTextureNormal = normal * texture(texture1Normal, vST).rgb;
	vec3 baseTextureSpecular = vec3(0.5);
    vec4 baseColor = CalculateTheLighting(baseTextureDiffuseColor, baseTextureSpecular, baseTextureNormal);
    
	vec3 coverTextureDiffuseColor = texture(texture2Diffuse, vST).rgb;
	vec3 coverTextureNormal = normal * texture(texture2Normal, vST).rgb;
	vec3 coverTextureSpecular = vec3(0.5);
	vec4 coverColor = CalculateTheLighting(coverTextureDiffuseColor, coverTextureSpecular, coverTextureNormal);
	
	// Interpolating between the two textures using the blending factor
    gl_FragColor = mix(baseColor, coverColor, blendFactor);
}
